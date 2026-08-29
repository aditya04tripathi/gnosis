import type { Octokit } from "@octokit/rest";
import { nanoid } from "nanoid";
import { getMilestoneMap } from "@/modules/github/lib/sync-milestones";
import type { IProjectPlan } from "@/modules/shared/models/ProjectPlan";
import ProjectIssue from "@/modules/shared/models/ProjectIssue";
import type { IssueStatus } from "@/modules/project/types/project.types";

type GithubIssuePayload = {
  number: number;
  state: string;
  title: string;
  body: string | null;
  labels: Array<{ name: string }>;
  milestone?: { number: number; title: string } | null;
};

function getIssueMap(
  github: NonNullable<IProjectPlan["github"]>,
): Map<string, { issueNumber: number }> {
  if (github.issueMap instanceof Map) {
    return github.issueMap;
  }
  return new Map(
    Object.entries(
      (github.issueMap ?? {}) as Record<string, { issueNumber: number }>,
    ),
  );
}

function findTaskIdByIssueNumber(
  github: NonNullable<IProjectPlan["github"]>,
  issueNumber: number,
): string | undefined {
  const issueMap = getIssueMap(github);
  for (const [taskId, entry] of issueMap.entries()) {
    if (entry.issueNumber === issueNumber) {
      return taskId;
    }
  }
  return undefined;
}

function mapGithubLabelsToTaskStatus(
  state: string,
  labels: string[],
): "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED" {
  if (state === "closed") {
    return "DONE";
  }
  if (labels.some((label) => label === "gnosis-blocked")) {
    return "BLOCKED";
  }
  if (
    labels.some(
      (label) =>
        label === "gnosis-in-progress" || label.includes("in-progress"),
    )
  ) {
    return "IN_PROGRESS";
  }
  if (labels.some((label) => label === "gnosis-done")) {
    return "DONE";
  }
  return "TODO";
}

export function mapGithubStateToIssueStatus(
  state: string,
  labels: string[],
): IssueStatus {
  if (state === "closed") {
    return "closed";
  }
  if (
    labels.some(
      (label) =>
        label === "gnosis-in-progress" || label.includes("in-progress"),
    )
  ) {
    return "in_progress";
  }
  if (labels.some((label) => label === "gnosis-done")) {
    return "done";
  }
  return "open";
}

function resolvePhaseIdFromMilestone(
  projectPlan: IProjectPlan,
  milestoneNumber?: number,
): string | undefined {
  if (!milestoneNumber || !projectPlan.github?.milestoneMap) {
    return undefined;
  }

  const milestoneMap =
    projectPlan.github.milestoneMap instanceof Map
      ? projectPlan.github.milestoneMap
      : new Map(
          Object.entries(
            (projectPlan.github.milestoneMap ?? {}) as Record<
              string,
              { number: number }
            >,
          ),
        );

  for (const [key, entry] of milestoneMap.entries()) {
    if (entry.number === milestoneNumber && key.startsWith("phase:")) {
      return key.replace("phase:", "");
    }
  }

  return undefined;
}

function resolveMilestoneIdFromGithub(
  projectPlan: IProjectPlan,
  milestoneNumber?: number,
): string | undefined {
  if (!milestoneNumber || !projectPlan.github?.milestoneMap) {
    return undefined;
  }

  const milestoneMap =
    projectPlan.github.milestoneMap instanceof Map
      ? projectPlan.github.milestoneMap
      : new Map(
          Object.entries(
            (projectPlan.github.milestoneMap ?? {}) as Record<
              string,
              { number: number }
            >,
          ),
        );

  for (const [key, entry] of milestoneMap.entries()) {
    if (entry.number === milestoneNumber && key.startsWith("milestone:")) {
      return key.replace("milestone:", "");
    }
  }

  return undefined;
}

export async function applyGithubIssueUpdate(
  projectPlan: IProjectPlan,
  issue: GithubIssuePayload,
): Promise<{ updated: "task" | "issue" | "imported" | "skipped" }> {
  const labels = issue.labels.map((label) => label.name);
  const github = projectPlan.github;
  if (!github) {
    return { updated: "skipped" };
  }

  const taskId = findTaskIdByIssueNumber(github, issue.number);
  if (taskId) {
    const status = mapGithubLabelsToTaskStatus(issue.state, labels);
    let taskFound = false;

    for (const phase of projectPlan.plan.phases) {
      const task = phase.tasks.find((item) => item.id === taskId);
      if (task) {
        task.status = status;
        if (issue.title) {
          task.title = issue.title;
        }
        if (issue.body !== null) {
          task.description = issue.body.split("---")[0]?.trim() ?? "";
        }
        taskFound = true;
        break;
      }
    }

    if (taskFound) {
      projectPlan.markModified("plan");
      return { updated: "task" };
    }
  }

  const projectIssue = await ProjectIssue.findOne({
    projectPlanId: projectPlan._id,
    githubIssueNumber: issue.number,
  });

  if (projectIssue) {
    projectIssue.status = mapGithubStateToIssueStatus(issue.state, labels);
    if (issue.title) {
      projectIssue.title = issue.title;
    }
    if (issue.body !== null) {
      projectIssue.body = issue.body.split("---")[0]?.trim() ?? "";
    }
    const milestoneId = resolveMilestoneIdFromGithub(
      projectPlan,
      issue.milestone?.number,
    );
    if (milestoneId) {
      projectIssue.milestoneId = milestoneId;
    }
    const phaseId = resolvePhaseIdFromMilestone(
      projectPlan,
      issue.milestone?.number,
    );
    if (phaseId) {
      projectIssue.phaseId = phaseId;
    }
    await projectIssue.save();
    return { updated: "issue" };
  }

  const typeLabel = labels.find((label) => label.startsWith("gnosis-"));
  const issueType =
    typeLabel === "gnosis-task"
      ? "task"
      : typeLabel?.replace("gnosis-", "") ?? "task";

  const nextNumber = (projectPlan.issueCounter ?? 0) + 1;
  projectPlan.issueCounter = nextNumber;

  const milestoneId = resolveMilestoneIdFromGithub(
    projectPlan,
    issue.milestone?.number,
  );
  const phaseId = resolvePhaseIdFromMilestone(
    projectPlan,
    issue.milestone?.number,
  );

  await ProjectIssue.create({
    projectPlanId: projectPlan._id,
    userId: projectPlan.userId,
    number: nextNumber,
    title: issue.title,
    body: issue.body?.split("---")[0]?.trim() ?? "",
    type: ["bug", "feature", "task", "epic", "chore"].includes(issueType)
      ? issueType
      : "task",
    status: mapGithubStateToIssueStatus(issue.state, labels),
    priority: labels.some((label) => label === "priority-high")
      ? "HIGH"
      : labels.some((label) => label === "priority-low")
        ? "LOW"
        : "MEDIUM",
    labels: labels.filter(
      (label) =>
        !label.startsWith("gnosis") && !label.startsWith("priority-"),
    ),
    milestoneId,
    phaseId,
    linkedTaskId: taskId,
    githubIssueNumber: issue.number,
    comments: [],
  });

  await projectPlan.save();
  return { updated: "imported" };
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

function findMilestoneMapKeyByNumber(
  github: NonNullable<IProjectPlan["github"]>,
  milestoneNumber: number,
): string | undefined {
  const milestoneMap = getMilestoneMap(github);
  for (const [key, entry] of milestoneMap.entries()) {
    if (entry.number === milestoneNumber) {
      return key;
    }
  }
  return undefined;
}

function ensureLocalMilestoneForGithub(
  projectPlan: IProjectPlan,
  milestone: {
    number: number;
    title: string;
    description?: string | null;
    state: string;
    due_on?: string | null;
  },
): void {
  const github = projectPlan.github;
  if (!github) {
    return;
  }

  const milestoneMap = getMilestoneMap(github);
  const existingKey = findMilestoneMapKeyByNumber(github, milestone.number);
  if (existingKey) {
    return;
  }

  const localMilestone = projectPlan.milestones?.find(
    (item) => normalizeTitle(item.title) === normalizeTitle(milestone.title),
  );

  if (localMilestone) {
    const mapKey = localMilestone.phaseId
      ? `phase:${localMilestone.phaseId}`
      : `milestone:${localMilestone.id}`;
    milestoneMap.set(mapKey, { number: milestone.number });
    projectPlan.github = { ...github, milestoneMap };
    projectPlan.markModified("github");
    return;
  }

  const id = nanoid();
  projectPlan.milestones = [
    ...(projectPlan.milestones ?? []),
    {
      id,
      title: milestone.title,
      description: milestone.description ?? "",
      dueDate: milestone.due_on ? new Date(milestone.due_on) : undefined,
      status: milestone.state === "closed" ? "closed" : "open",
    },
  ];
  milestoneMap.set(`milestone:${id}`, { number: milestone.number });
  projectPlan.github = { ...github, milestoneMap };
  projectPlan.markModified("milestones");
  projectPlan.markModified("github");
}

export async function applyGithubMilestoneUpdate(
  projectPlan: IProjectPlan,
  milestone: { number: number; title: string; state: string },
): Promise<boolean> {
  if (!projectPlan.github?.milestoneMap) {
    return false;
  }

  const milestoneMap =
    projectPlan.github.milestoneMap instanceof Map
      ? projectPlan.github.milestoneMap
      : new Map(
          Object.entries(
            (projectPlan.github.milestoneMap ?? {}) as Record<
              string,
              { number: number }
            >,
          ),
        );

  let mapKey: string | undefined;
  for (const [key, entry] of milestoneMap.entries()) {
    if (entry.number === milestone.number) {
      mapKey = key;
      break;
    }
  }

  if (!mapKey) {
    return false;
  }

  const milestoneId = mapKey.startsWith("milestone:")
    ? mapKey.replace("milestone:", "")
    : undefined;
  const phaseId = mapKey.startsWith("phase:")
    ? mapKey.replace("phase:", "")
    : undefined;

  const localMilestone = projectPlan.milestones?.find((item) => {
    if (milestoneId) {
      return item.id === milestoneId;
    }
    if (phaseId) {
      return item.phaseId === phaseId;
    }
    return item.title.trim().toLowerCase() === milestone.title.trim().toLowerCase();
  });

  if (!localMilestone) {
    return false;
  }

  localMilestone.status = milestone.state === "closed" ? "closed" : "open";
  if (milestone.title) {
    localMilestone.title = milestone.title;
  }
  projectPlan.markModified("milestones");
  return true;
}

export async function syncGitHubToGnosis(
  octokit: Octokit,
  projectPlan: IProjectPlan,
  onProgress?: (current: number, total: number, stage: string) => void,
): Promise<{ imported: number; updated: number }> {
  const github = projectPlan.github;
  if (!github?.owner || !github.repo) {
    return { imported: 0, updated: 0 };
  }

  const { owner, repo } = github;
  let imported = 0;
  let updated = 0;

  const milestones = await octokit.paginate(octokit.rest.issues.listMilestones, {
    owner,
    repo,
    state: "all",
    per_page: 100,
  });

  for (const milestone of milestones) {
    ensureLocalMilestoneForGithub(projectPlan, {
      number: milestone.number,
      title: milestone.title,
      description: milestone.description,
      state: milestone.state,
      due_on: milestone.due_on,
    });

    const changed = await applyGithubMilestoneUpdate(projectPlan, {
      number: milestone.number,
      title: milestone.title,
      state: milestone.state,
    });
    if (changed) {
      updated += 1;
    }
  }

  const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner,
    repo,
    state: "all",
    per_page: 100,
  });

  const trackedIssues = issues.filter((issue) => !issue.pull_request);
  const total = trackedIssues.length;

  for (let index = 0; index < trackedIssues.length; index += 1) {
    const issue = trackedIssues[index];
    onProgress?.(index + 1, total, "Pulling from GitHub");

    const result = await applyGithubIssueUpdate(projectPlan, {
      number: issue.number,
      state: issue.state,
      title: issue.title,
      body: issue.body ?? null,
      labels: issue.labels.map((label) =>
        typeof label === "string" ? { name: label } : { name: label.name ?? "" },
      ),
      milestone: issue.milestone
        ? { number: issue.milestone.number, title: issue.milestone.title }
        : null,
    });

    if (result.updated === "imported") {
      imported += 1;
    } else if (result.updated === "task" || result.updated === "issue") {
      updated += 1;
    }
  }

  await projectPlan.save();
  return { imported, updated };
}

export async function ensureGnosisIssuesFromBoardTasks(
  projectPlan: IProjectPlan,
): Promise<number> {
  let created = 0;

  for (const phase of projectPlan.plan.phases) {
    for (const task of phase.tasks) {
      const existing = await ProjectIssue.findOne({
        projectPlanId: projectPlan._id,
        $or: [{ linkedTaskId: task.id }, { title: task.title, phaseId: phase.id }],
      });

      if (existing) {
        if (!existing.linkedTaskId) {
          existing.linkedTaskId = task.id;
          await existing.save();
        }
        continue;
      }

      const nextNumber = (projectPlan.issueCounter ?? 0) + 1;
      projectPlan.issueCounter = nextNumber;

      await ProjectIssue.create({
        projectPlanId: projectPlan._id,
        userId: projectPlan.userId,
        number: nextNumber,
        title: task.title,
        body: task.description ?? "",
        type: "task",
        status:
          task.status === "DONE"
            ? "done"
            : task.status === "IN_PROGRESS"
              ? "in_progress"
              : "open",
        priority: task.priority ?? "MEDIUM",
        labels: task.tags ?? [],
        phaseId: phase.id,
        linkedTaskId: task.id,
        comments: [],
      });
      created += 1;
    }
  }

  if (created > 0) {
    await projectPlan.save();
  }

  return created;
}
