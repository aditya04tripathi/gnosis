import type { Octokit } from "@octokit/rest";
import { githubGraphql } from "@/modules/github/lib/github-graphql";
import { getGitHubConfig } from "@/modules/github/lib/github-config";
import type { IProjectPlan } from "@/modules/shared/models/ProjectPlan";
import ProjectIssue from "@/modules/shared/models/ProjectIssue";

export type GnosisGitHubIssue = {
  number: number;
  title: string;
  body: string | null;
  labels: string[];
  state: string;
};

type IssueMapEntry = { issueNumber: number };
type MilestoneMapEntry = { number: number };

export function getIssueMap(
  github: NonNullable<IProjectPlan["github"]>,
): Map<string, IssueMapEntry> {
  if (github.issueMap instanceof Map) {
    return github.issueMap as Map<string, IssueMapEntry>;
  }
  return new Map(
    Object.entries((github.issueMap ?? {}) as Record<string, IssueMapEntry>),
  );
}

export function getMilestoneMap(
  github: NonNullable<IProjectPlan["github"]>,
): Map<string, MilestoneMapEntry> {
  const raw = github.milestoneMap;
  if (raw instanceof Map) {
    return raw;
  }
  return new Map(
    Object.entries((raw ?? {}) as Record<string, MilestoneMapEntry>),
  );
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseGnosisBodyMarkers(
  body: string | null,
  projectPlanId: string,
): { taskId?: string; gnosisIssueNumber?: number } {
  if (!body) {
    return {};
  }

  const { appUrl } = getGitHubConfig();
  const pattern = new RegExp(
    `${escapeRegExp(appUrl)}/project/${escapeRegExp(projectPlanId)}(?:\\?([^)\\s#"']+))?`,
    "i",
  );
  const match = body.match(pattern);
  if (!match) {
    return {};
  }

  const params = new URLSearchParams(match[1] ?? "");
  const gnosisIssueNumber = params.get("issue");
  const taskId = params.get("task") ?? undefined;

  return {
    taskId,
    gnosisIssueNumber: gnosisIssueNumber
      ? Number.parseInt(gnosisIssueNumber, 10)
      : undefined,
  };
}

export async function fetchGnosisGitHubIssues(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<GnosisGitHubIssue[]> {
  const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner,
    repo,
    state: "all",
    labels: "gnosis",
    per_page: 100,
  });

  return issues
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      number: issue.number,
      title: issue.title,
      body: issue.body ?? null,
      labels: issue.labels.map((label) =>
        typeof label === "string" ? label : (label.name ?? ""),
      ),
      state: issue.state,
    }));
}

export async function findGithubIssueByTitle(
  octokit: Octokit,
  owner: string,
  repo: string,
  title: string,
  options?: {
    requireLabel?: string;
    excludeLabel?: string;
    excludeNumbers?: Set<number>;
  },
): Promise<number | null> {
  const issues = await fetchGnosisGitHubIssues(octokit, owner, repo);
  const normalizedTitle = normalizeTitle(title);
  const excludeNumbers = options?.excludeNumbers ?? new Set<number>();

  const matches = issues.filter((issue) => {
    if (excludeNumbers.has(issue.number)) {
      return false;
    }
    if (normalizeTitle(issue.title) !== normalizedTitle) {
      return false;
    }
    if (
      options?.requireLabel &&
      !issue.labels.includes(options.requireLabel)
    ) {
      return false;
    }
    if (
      options?.excludeLabel &&
      issue.labels.includes(options.excludeLabel)
    ) {
      return false;
    }
    return true;
  });

  if (matches.length !== 1) {
    return null;
  }

  return matches[0].number;
}

export async function findGithubIssueForGnosisIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  projectPlanId: string,
  gnosisIssueNumber: number,
  title: string,
): Promise<number | null> {
  const issues = await fetchGnosisGitHubIssues(octokit, owner, repo);

  for (const ghIssue of issues) {
    const markers = parseGnosisBodyMarkers(ghIssue.body, projectPlanId);
    if (markers.gnosisIssueNumber === gnosisIssueNumber) {
      return ghIssue.number;
    }
  }

  return findGithubIssueByTitle(octokit, owner, repo, title, {
    excludeLabel: "gnosis-task",
  });
}

export async function reconcileMilestoneMap(
  octokit: Octokit,
  projectPlan: IProjectPlan,
): Promise<number> {
  const github = projectPlan.github;
  if (!github?.owner || !github.repo) {
    return 0;
  }

  const milestones = await octokit.paginate(octokit.rest.issues.listMilestones, {
    owner: github.owner,
    repo: github.repo,
    state: "all",
    per_page: 100,
  });

  const byTitle = new Map<string, number>();
  for (const milestone of milestones) {
    byTitle.set(normalizeTitle(milestone.title), milestone.number);
  }

  const milestoneMap = getMilestoneMap(github);
  let linked = 0;

  for (const milestone of projectPlan.milestones ?? []) {
    const mapKey = milestone.phaseId
      ? `phase:${milestone.phaseId}`
      : `milestone:${milestone.id}`;

    if (milestoneMap.get(mapKey)?.number) {
      continue;
    }

    const number = byTitle.get(normalizeTitle(milestone.title));
    if (!number) {
      continue;
    }

    milestoneMap.set(mapKey, { number });
    linked += 1;
  }

  if (linked > 0) {
    projectPlan.github = {
      ...github,
      milestoneMap,
    };
    projectPlan.markModified("github");
  }

  return linked;
}

export async function reconcileGitHubIssueLinks(
  octokit: Octokit,
  projectPlan: IProjectPlan,
): Promise<{ tasksLinked: number; issuesLinked: number }> {
  const github = projectPlan.github;
  if (!github?.owner || !github.repo) {
    return { tasksLinked: 0, issuesLinked: 0 };
  }

  const projectPlanId = String(projectPlan._id);
  const gnosisIssues = await fetchGnosisGitHubIssues(
    octokit,
    github.owner,
    github.repo,
  );
  const issueMap = getIssueMap(github);
  const usedNumbers = new Set<number>();

  for (const entry of issueMap.values()) {
    if (entry.issueNumber) {
      usedNumbers.add(entry.issueNumber);
    }
  }

  const projectIssues = await ProjectIssue.find({
    projectPlanId: projectPlan._id,
  });
  for (const issue of projectIssues) {
    if (issue.githubIssueNumber) {
      usedNumbers.add(issue.githubIssueNumber);
    }
  }

  const byTitle = new Map<string, GnosisGitHubIssue[]>();
  for (const issue of gnosisIssues) {
    const key = normalizeTitle(issue.title);
    const list = byTitle.get(key) ?? [];
    list.push(issue);
    byTitle.set(key, list);
  }

  let tasksLinked = 0;

  for (const phase of projectPlan.plan.phases) {
    for (const task of phase.tasks) {
      const existing = issueMap.get(task.id);
      if (existing?.issueNumber) {
        continue;
      }

      let matched: GnosisGitHubIssue | undefined;
      for (const ghIssue of gnosisIssues) {
        if (usedNumbers.has(ghIssue.number)) {
          continue;
        }
        const markers = parseGnosisBodyMarkers(ghIssue.body, projectPlanId);
        if (markers.taskId === task.id) {
          matched = ghIssue;
          break;
        }
      }

      if (!matched) {
        const candidates = (byTitle.get(normalizeTitle(task.title)) ?? []).filter(
          (ghIssue) =>
            ghIssue.labels.includes("gnosis-task") &&
            !usedNumbers.has(ghIssue.number),
        );
        if (candidates.length === 1) {
          matched = candidates[0];
        }
      }

      if (!matched) {
        continue;
      }

      issueMap.set(task.id, { issueNumber: matched.number });
      usedNumbers.add(matched.number);
      tasksLinked += 1;
    }
  }

  let issuesLinked = 0;

  for (const issue of projectIssues) {
    if (issue.githubIssueNumber) {
      continue;
    }

    let matched: GnosisGitHubIssue | undefined;
    for (const ghIssue of gnosisIssues) {
      if (usedNumbers.has(ghIssue.number)) {
        continue;
      }
      const markers = parseGnosisBodyMarkers(ghIssue.body, projectPlanId);
      if (markers.gnosisIssueNumber === issue.number) {
        matched = ghIssue;
        break;
      }
    }

    if (!matched) {
      const candidates = (byTitle.get(normalizeTitle(issue.title)) ?? []).filter(
        (ghIssue) =>
          !ghIssue.labels.includes("gnosis-task") &&
          !usedNumbers.has(ghIssue.number),
      );
      if (candidates.length === 1) {
        matched = candidates[0];
      }
    }

    if (!matched) {
      continue;
    }

    issue.githubIssueNumber = matched.number;
    await issue.save();
    usedNumbers.add(matched.number);
    issuesLinked += 1;

    if (issue.linkedTaskId && !issueMap.has(issue.linkedTaskId)) {
      issueMap.set(issue.linkedTaskId, { issueNumber: matched.number });
    }
  }

  if (tasksLinked > 0 || issuesLinked > 0) {
    projectPlan.github = {
      ...github,
      issueMap,
    };
    projectPlan.markModified("github");
  }

  return { tasksLinked, issuesLinked };
}

export async function reconcileGitHubBeforeSync(
  octokit: Octokit,
  projectPlan: IProjectPlan,
): Promise<void> {
  await reconcileMilestoneMap(octokit, projectPlan);
  await reconcileGitHubIssueLinks(octokit, projectPlan);
}

export async function findExistingGitHubProject(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<{ id: string; number: number; url: string } | null> {
  const result = await githubGraphql<{
    repository: {
      projectsV2: {
        nodes: Array<{ id: string; number: number; title: string; url: string }>;
      };
    } | null;
  }>(
    octokit,
    `query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        projectsV2(first: 50) {
          nodes { id number title url }
        }
      }
    }`,
    { owner, repo },
  );

  const expectedTitle = `Gnosis – ${repo}`;
  const match = result.repository?.projectsV2.nodes.find(
    (project) =>
      project.title === expectedTitle || project.title.startsWith("Gnosis –"),
  );

  return match ?? null;
}

import { isValidGitHubProjectNodeId } from "@/modules/github/lib/github-project-id";

type ProjectItemPage = {
  node: {
    items: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: Array<{
        id: string;
        content: { number?: number } | null;
      }>;
    };
  } | null;
};

export async function loadGitHubProjectItemIndex(
  octokit: Octokit,
  projectId: string,
): Promise<Map<number, string>> {
  const index = new Map<number, string>();
  if (!isValidGitHubProjectNodeId(projectId)) {
    return index;
  }

  let cursor: string | null = null;

  for (;;) {
    const result: ProjectItemPage = await githubGraphql<ProjectItemPage>(
      octokit,
      `query($projectId: ID!, $cursor: String) {
        node(id: $projectId) {
          ... on ProjectV2 {
            items(first: 100, after: $cursor) {
              pageInfo { hasNextPage endCursor }
              nodes {
                id
                content {
                  ... on Issue { number }
                }
              }
            }
          }
        }
      }`,
      { projectId, cursor },
    );

    const items = result.node?.items;
    if (!items) {
      break;
    }

    for (const item of items.nodes) {
      const issueNumber = item.content?.number;
      if (issueNumber) {
        index.set(issueNumber, item.id);
      }
    }

    if (!items.pageInfo.hasNextPage) {
      break;
    }
    cursor = items.pageInfo.endCursor;
  }

  return index;
}
