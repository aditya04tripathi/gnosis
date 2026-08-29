import type { Octokit } from "@octokit/rest";
import { githubGraphql } from "@/modules/github/lib/github-graphql";
import {
  readGitHubProjectNodeId,
  toPlainGitHubProject,
} from "@/modules/github/lib/github-project-id";
import {
  findExistingGitHubProject,
  loadGitHubProjectItemIndex,
} from "@/modules/github/lib/sync-reconcile";
import ProjectIssue from "@/modules/shared/models/ProjectIssue";
import type { IProjectPlan } from "@/modules/shared/models/ProjectPlan";

const GNOSIS_STATUS_OPTIONS = [
  { name: "Todo", color: "GRAY", description: "Not started" },
  { name: "In progress", color: "BLUE", description: "Currently in progress" },
  { name: "Done", color: "GREEN", description: "Completed" },
  { name: "Blocked", color: "RED", description: "Blocked or waiting" },
] as const;

const TASK_STATUS_TO_GITHUB_STATUS: Record<string, string> = {
  TODO: "Todo",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  BLOCKED: "Blocked",
};

const DESIRED_VIEWS = [
  { name: "Board", layout: "BOARD_LAYOUT" },
  { name: "List", layout: "TABLE_LAYOUT" },
  { name: "Roadmap", layout: "ROADMAP_LAYOUT" },
] as const;

type GitHubProjectState = NonNullable<
  NonNullable<IProjectPlan["github"]>["project"]
>;

type ProjectFieldNode = {
  id: string;
  name: string;
  options?: Array<{ id: string; name: string }>;
};

async function getOwnerId(octokit: Octokit, owner: string): Promise<string> {
  const userResult = await githubGraphql<{
    user: { id: string } | null;
  }>(
    octokit,
    `query($login: String!) {
      user(login: $login) { id }
    }`,
    { login: owner },
  );

  if (userResult.user?.id) {
    return userResult.user.id;
  }

  const orgResult = await githubGraphql<{
    organization: { id: string } | null;
  }>(
    octokit,
    `query($login: String!) {
      organization(login: $login) { id }
    }`,
    { login: owner },
  );

  if (orgResult.organization?.id) {
    return orgResult.organization.id;
  }

  throw new Error(`GitHub owner not found: ${owner}`);
}

async function getRepositoryId(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<string> {
  const result = await githubGraphql<{
    repository: { id: string } | null;
  }>(
    octokit,
    `query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) { id }
    }`,
    { owner, repo },
  );

  if (!result.repository?.id) {
    throw new Error(`Repository not found: ${owner}/${repo}`);
  }

  return result.repository.id;
}

async function getIssueNodeId(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<string | null> {
  const result = await githubGraphql<{
    repository: { issue: { id: string } | null } | null;
  }>(
    octokit,
    `query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $number) { id }
      }
    }`,
    { owner, repo, number: issueNumber },
  );

  return result.repository?.issue?.id ?? null;
}

function getProjectItemMap(
  project: GitHubProjectState,
): Map<string, { itemId: string }> {
  const raw = project?.itemMap;
  if (raw instanceof Map) {
    return raw;
  }
  return new Map(
    Object.entries((raw ?? {}) as Record<string, { itemId: string }>),
  );
}

function getStatusOptionMap(
  project: GitHubProjectState,
): Map<string, string> {
  const raw = project?.statusOptions;
  if (raw instanceof Map) {
    return raw;
  }
  return new Map(Object.entries((raw ?? {}) as Record<string, string>));
}

async function fetchProjectFields(
  octokit: Octokit,
  projectId: string,
): Promise<ProjectFieldNode[]> {
  const result = await githubGraphql<{
    node: {
      fields: { nodes: Array<ProjectFieldNode & { __typename?: string }> };
      views: { nodes: Array<{ id: string; name: string; layout: string }> };
    } | null;
  }>(
    octokit,
    `query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          views(first: 20) {
            nodes { id name layout }
          }
          fields(first: 30) {
            nodes {
              __typename
              ... on ProjectV2SingleSelectField {
                id
                name
                options { id name }
              }
            }
          }
        }
      }
    }`,
    { projectId },
  );

  return result.node?.fields.nodes ?? [];
}

function buildStatusOptionsMap(
  options: Array<{ id: string; name: string }>,
): Map<string, string> {
  const statusOptions = new Map<string, string>();
  for (const option of options) {
    const gnosisKey = Object.entries(TASK_STATUS_TO_GITHUB_STATUS).find(
      ([, githubName]) => githubName === option.name,
    )?.[0];
    if (gnosisKey) {
      statusOptions.set(gnosisKey, option.id);
    }
  }
  return statusOptions;
}

function statusFieldNeedsUpdate(statusField: ProjectFieldNode): boolean {
  const existingOptions = statusField.options ?? [];
  return !GNOSIS_STATUS_OPTIONS.every((desired) =>
    existingOptions.some((option) => option.name === desired.name),
  );
}

async function configureStatusField(
  octokit: Octokit,
  projectId: string,
  fields: ProjectFieldNode[],
): Promise<{ fieldId: string; statusOptions: Map<string, string> }> {
  const statusField = fields.find((field) => field.name === "Status");
  if (!statusField) {
    throw new Error("GitHub project is missing the Status field");
  }

  if (!statusFieldNeedsUpdate(statusField)) {
    return {
      fieldId: statusField.id,
      statusOptions: buildStatusOptionsMap(statusField.options ?? []),
    };
  }

  const updated = await githubGraphql<{
    updateProjectV2Field: {
      projectV2Field: {
        options: Array<{ id: string; name: string }>;
      };
    };
  }>(
    octokit,
    `mutation($fieldId: ID!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) {
      updateProjectV2Field(input: { fieldId: $fieldId, singleSelectOptions: $options }) {
        projectV2Field {
          ... on ProjectV2SingleSelectField {
            options { id name }
          }
        }
      }
    }`,
    {
      fieldId: statusField.id,
      options: GNOSIS_STATUS_OPTIONS.map((option) => ({
        name: option.name,
        color: option.color,
        description: option.description,
      })),
    },
  );

  return {
    fieldId: statusField.id,
    statusOptions: buildStatusOptionsMap(
      updated.updateProjectV2Field.projectV2Field.options,
    ),
  };
}

async function ensureProjectViews(
  octokit: Octokit,
  projectId: string,
  existingLayouts: Set<string>,
): Promise<void> {
  for (const view of DESIRED_VIEWS) {
    if (existingLayouts.has(view.layout)) {
      continue;
    }

    await githubGraphql(
      octokit,
      `mutation($projectId: ID!, $name: String!, $layout: ProjectV2ViewLayout!) {
        createProjectV2View(input: { projectId: $projectId, name: $name, layout: $layout }) {
          projectV2View { id }
        }
      }`,
      {
        projectId,
        name: view.name,
        layout: view.layout,
      },
    );
  }
}

async function createGitHubProject(
  octokit: Octokit,
  ownerId: string,
  repositoryId: string,
  title: string,
): Promise<{ id: string; number: number; url: string }> {
  const result = await githubGraphql<{
    createProjectV2: {
      projectV2: { id: string; number: number; url: string };
    };
  }>(
    octokit,
    `mutation($ownerId: ID!, $repositoryId: ID!, $title: String!) {
      createProjectV2(input: { ownerId: $ownerId, repositoryId: $repositoryId, title: $title }) {
        projectV2 { id number url }
      }
    }`,
    { ownerId, repositoryId, title },
  );

  return result.createProjectV2.projectV2;
}

export async function ensureGitHubProject(
  octokit: Octokit,
  projectPlan: IProjectPlan,
): Promise<GitHubProjectState> {
  const github = projectPlan.github;
  if (!github?.owner || !github.repo) {
    throw new Error("GitHub repository not linked");
  }

  const { owner, repo } = github;
  const repositoryId = await getRepositoryId(octokit, owner, repo);

  let project = github.project
    ? toPlainGitHubProject(github.project)
    : undefined;
  let nodeId = readGitHubProjectNodeId(project);

  if (!nodeId) {
    const existing = await findExistingGitHubProject(octokit, owner, repo);
    if (existing) {
      project = {
        id: existing.id,
        number: existing.number,
        url: existing.url,
        statusFieldId: project?.statusFieldId ?? "",
        statusOptions: project?.statusOptions ?? new Map(),
        itemMap: project?.itemMap ?? new Map(),
      };
      nodeId = existing.id;
    } else {
      const ownerId = await getOwnerId(octokit, owner);
      const created = await createGitHubProject(
        octokit,
        ownerId,
        repositoryId,
        `Gnosis – ${repo}`,
      );
      project = {
        id: created.id,
        number: created.number,
        url: created.url,
        statusFieldId: "",
        statusOptions: new Map(),
        itemMap: new Map(),
      };
      nodeId = created.id;
    }
  }

  if (!project || !nodeId) {
    throw new Error("Failed to resolve GitHub project");
  }

  const projectNode = await githubGraphql<{
    node: {
      views: { nodes: Array<{ layout: string }> };
    } | null;
  }>(
    octokit,
    `query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          views(first: 20) {
            nodes { layout }
          }
        }
      }
    }`,
    { projectId: nodeId },
  );

  const existingLayouts = new Set(
    projectNode.node?.views.nodes.map((view) => view.layout) ?? [],
  );
  await ensureProjectViews(octokit, nodeId, existingLayouts);

  const fields = await fetchProjectFields(octokit, nodeId);
  const { fieldId, statusOptions } = await configureStatusField(
    octokit,
    nodeId,
    fields,
  );

  project = {
    ...project,
    id: nodeId,
    statusFieldId: fieldId,
    statusOptions,
    itemMap: getProjectItemMap(project),
  };

  if (!projectPlan.github) {
    throw new Error("GitHub repository not linked");
  }

  projectPlan.github = {
    ...projectPlan.github,
    project,
  };
  projectPlan.markModified("github");

  return project;
}

async function upsertProjectItem(
  octokit: Octokit,
  project: GitHubProjectState,
  owner: string,
  repo: string,
  mapKey: string,
  issueNumber: number,
  taskStatus: string,
  itemIndex: Map<number, string>,
): Promise<void> {
  const projectNodeId = readGitHubProjectNodeId(project);
  if (!projectNodeId) {
    return;
  }

  const issueNodeId = await getIssueNodeId(octokit, owner, repo, issueNumber);
  if (!issueNodeId) {
    return;
  }

  const itemMap = getProjectItemMap(project);
  let itemId = itemMap.get(mapKey)?.itemId ?? itemIndex.get(issueNumber);

  if (!itemId) {
    const added = await githubGraphql<{
      addProjectV2ItemById: { item: { id: string } };
    }>(
      octokit,
      `mutation($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
          item { id }
        }
      }`,
      { projectId: projectNodeId, contentId: issueNodeId },
    );
    itemId = added.addProjectV2ItemById.item.id;
    itemIndex.set(issueNumber, itemId);
  }

  itemMap.set(mapKey, { itemId });

  const statusOptions = getStatusOptionMap(project);
  const githubStatusName = TASK_STATUS_TO_GITHUB_STATUS[taskStatus];
  const optionId = [...statusOptions.entries()].find(
    ([gnosisStatus]) =>
      TASK_STATUS_TO_GITHUB_STATUS[gnosisStatus] === githubStatusName,
  )?.[1];

  if (!optionId || !project.statusFieldId) {
    return;
  }

  await githubGraphql(
    octokit,
    `mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: { singleSelectOptionId: $optionId }
        }
      ) {
        projectV2Item { id }
      }
    }`,
    {
      projectId: projectNodeId,
      itemId,
      fieldId: project.statusFieldId,
      optionId,
    },
  );

  project.itemMap = itemMap;
}

export async function syncBoardItemsToGitHubProject(
  octokit: Octokit,
  projectPlan: IProjectPlan,
): Promise<{ synced: number }> {
  const project = await ensureGitHubProject(octokit, projectPlan);
  const nodeId = readGitHubProjectNodeId(project);
  const github = projectPlan.github;
  if (!github?.owner || !github.repo || !nodeId) {
    return { synced: 0 };
  }

  const issueMap =
    github.issueMap instanceof Map
      ? github.issueMap
      : new Map(
          Object.entries(
            (github.issueMap ?? {}) as Record<string, { issueNumber: number }>,
          ),
        );

  const itemIndex = await loadGitHubProjectItemIndex(octokit, nodeId);
  let synced = 0;

  for (const phase of projectPlan.plan.phases) {
    for (const task of phase.tasks) {
      const issueEntry = issueMap.get(task.id);
      if (!issueEntry?.issueNumber) {
        continue;
      }

      await upsertProjectItem(
        octokit,
        project,
        github.owner,
        github.repo,
        `task:${task.id}`,
        issueEntry.issueNumber,
        task.status,
        itemIndex,
      );
      synced += 1;
    }
  }

  const projectIssues = await ProjectIssue.find({
    projectPlanId: projectPlan._id,
    githubIssueNumber: { $exists: true, $ne: null },
  });

  for (const issue of projectIssues) {
    if (!issue.githubIssueNumber) {
      continue;
    }

    const status =
      issue.status === "done"
        ? "DONE"
        : issue.status === "closed"
          ? "DONE"
          : issue.status === "in_progress"
            ? "IN_PROGRESS"
            : "TODO";

    await upsertProjectItem(
      octokit,
      project,
      github.owner,
      github.repo,
      `issue:${String(issue._id)}`,
      issue.githubIssueNumber,
      status,
      itemIndex,
    );
    synced += 1;
  }

  if (projectPlan.github) {
    projectPlan.github = {
      ...projectPlan.github,
      project,
    };
    projectPlan.markModified("github");
  }

  return { synced };
}
