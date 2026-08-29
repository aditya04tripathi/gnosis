import type { Octokit } from "@octokit/rest";
import { nanoid } from "nanoid";
import { getGitHubConfig } from "@/modules/github/lib/github-config";
import { GNOSIS_BYLINE } from "@/modules/github/lib/gnosis-attribution";
import {
  getGithubMilestoneForGnosisMilestone,
  getGithubMilestoneForPhase,
  syncMilestonesToGitHub,
} from "@/modules/github/lib/sync-milestones";
import type { IProjectIssue } from "@/modules/shared/models/ProjectIssue";
import type { IProjectPlan } from "@/modules/shared/models/ProjectPlan";
import ProjectIssue from "@/modules/shared/models/ProjectIssue";
import type {
  ProjectPlan,
  ProjectTask,
} from "@/modules/validation/types/validation.types";
import { syncIssueToGitHub } from "@/modules/github/lib/sync-issue";
import { isGitHubProjectScopeError } from "@/modules/github/lib/github-scope-status";
import { syncBoardItemsToGitHubProject } from "@/modules/github/lib/sync-github-project";
import {
  findGithubIssueByTitle,
  getIssueMap,
  reconcileGitHubBeforeSync,
} from "@/modules/github/lib/sync-reconcile";

type TaskWithPhase = ProjectTask & { phaseName: string; phaseId: string };

type TaskStatus = ProjectTask["status"];
type TaskPriority = ProjectTask["priority"];

function normalizeTaskStatus(status: unknown): TaskStatus {
  if (
    status === "TODO" ||
    status === "IN_PROGRESS" ||
    status === "DONE" ||
    status === "BLOCKED"
  ) {
    return status;
  }
  return "TODO";
}

function normalizeTaskPriority(priority: unknown): TaskPriority {
  if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
    return priority;
  }
  return "MEDIUM";
}

export function normalizePlanForGitHub(plan: ProjectPlan): {
  plan: ProjectPlan;
  changed: boolean;
} {
  let changed = false;

  const phases = plan.phases.map((phase) => {
    const phaseId = phase.id || nanoid();
    if (!phase.id) {
      changed = true;
    }

    const tasks = phase.tasks.map((task) => {
      const normalized: ProjectTask = {
        id: task.id || nanoid(),
        title: task.title?.trim() || "Untitled task",
        description: task.description ?? "",
        status: normalizeTaskStatus(task.status),
        priority: normalizeTaskPriority(task.priority),
        tags: Array.isArray(task.tags) ? task.tags.filter(Boolean) : [],
        phaseId: task.phaseId || phaseId,
        assignee: task.assignee,
        dueDate: task.dueDate,
      };

      if (
        task.id !== normalized.id ||
        task.title !== normalized.title ||
        (task.description ?? "") !== normalized.description ||
        task.status !== normalized.status ||
        task.priority !== normalized.priority ||
        !Array.isArray(task.tags) ||
        (task.phaseId || phaseId) !== normalized.phaseId
      ) {
        changed = true;
      }

      return normalized;
    });

    return {
      ...phase,
      id: phaseId,
      dependencies: phase.dependencies ?? [],
      tasks,
    };
  });

  return {
    plan: {
      ...plan,
      phases,
    },
    changed,
  };
}

function normalizeBoardTask(
  task: TaskWithPhase,
): TaskWithPhase & { status: TaskStatus; priority: TaskPriority; tags: string[] } {
  return {
    ...task,
    title: task.title?.trim() || "Untitled task",
    description: task.description ?? "",
    status: normalizeTaskStatus(task.status),
    priority: normalizeTaskPriority(task.priority),
    tags: Array.isArray(task.tags) ? task.tags.filter(Boolean) : [],
    phaseId: task.phaseId,
    phaseName: task.phaseName || "Unassigned",
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function getTaskLabels(task: ReturnType<typeof normalizeBoardTask>): string[] {
  return [
    "gnosis",
    "gnosis-task",
    `gnosis-${task.status.toLowerCase().replace("_", "-")}`,
    `priority-${task.priority.toLowerCase()}`,
    ...task.tags.map((tag) => slugify(tag)).filter(Boolean).slice(0, 5),
  ];
}

function buildIssueBody(
  projectPlanId: string,
  task: ReturnType<typeof normalizeBoardTask>,
): string {
  const { appUrl } = getGitHubConfig();
  return [
    task.description || "_No description provided._",
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| Phase | ${task.phaseName} |`,
    `| Priority | ${task.priority} |`,
    `| Status | ${task.status.replace("_", " ")} |`,
    "",
    "---",
    GNOSIS_BYLINE.trim(),
    `Managed in [Gnosis](${appUrl}/project/${projectPlanId}?task=${task.id})`,
  ].join("\n");
}

type IssueMapEntry = { issueNumber: number };

function getLocalIssueMap(
  github: NonNullable<IProjectPlan["github"]>,
): Map<string, IssueMapEntry> {
  return getIssueMap(github);
}

function flattenTasks(plan: ProjectPlan): TaskWithPhase[] {
  return plan.phases.flatMap((phase) =>
    phase.tasks.map((task) => ({
      ...task,
      phaseName: phase.name,
      phaseId: phase.id,
    })),
  );
}

async function ensureLabels(
  octokit: Octokit,
  owner: string,
  repo: string,
  labels: string[],
): Promise<void> {
  const uniqueLabels = [...new Set(labels)];
  await Promise.all(
    uniqueLabels.map((name) =>
      octokit.rest.issues
        .createLabel({
          owner,
          repo,
          name,
          color: name.startsWith("priority-high")
            ? "d73a4a"
            : name.startsWith("priority-medium")
              ? "fbca04"
              : name.startsWith("gnosis-done")
                ? "0e8a16"
                : name.startsWith("gnosis-blocked")
                  ? "b60205"
                  : "1d76db",
        })
        .catch(() => undefined),
    ),
  );
}

function resolveMilestoneNumber(
  github: NonNullable<IProjectPlan["github"]>,
  phaseId: string,
  milestoneId?: string,
): number | undefined {
  if (milestoneId) {
    const fromMilestone = getGithubMilestoneForGnosisMilestone(
      github,
      milestoneId,
    );
    if (fromMilestone) {
      return fromMilestone;
    }
  }

  return getGithubMilestoneForPhase(github, phaseId);
}

export async function syncTaskToGitHub(
  octokit: Octokit,
  projectPlan: IProjectPlan,
  task: TaskWithPhase,
): Promise<number> {
  const github = projectPlan.github;
  if (!github?.owner || !github.repo) {
    throw new Error("GitHub repository not linked");
  }

  const normalizedTask = normalizeBoardTask(task);
  const { owner, repo } = github;
  const labels = getTaskLabels(normalizedTask);
  await ensureLabels(octokit, owner, repo, labels);

  const issueMap = getLocalIssueMap(github);
  const milestone = resolveMilestoneNumber(github, normalizedTask.phaseId);

  const existing = issueMap.get(normalizedTask.id);
  const payload = {
    owner,
    repo,
    title: normalizedTask.title,
    body: buildIssueBody(String(projectPlan._id), normalizedTask),
    labels,
    state:
      normalizedTask.status === "DONE" ? ("closed" as const) : ("open" as const),
    milestone,
  };

  if (existing?.issueNumber) {
    await octokit.rest.issues.update({
      ...payload,
      issue_number: existing.issueNumber,
    });
    return existing.issueNumber;
  }

  const existingNumber = await findGithubIssueByTitle(
    octokit,
    owner,
    repo,
    normalizedTask.title,
    { requireLabel: "gnosis-task" },
  );
  if (existingNumber) {
    await octokit.rest.issues.update({
      ...payload,
      issue_number: existingNumber,
    });
    issueMap.set(normalizedTask.id, { issueNumber: existingNumber });
    projectPlan.github = {
      ...github,
      issueMap,
      lastSyncedAt: new Date(),
    };
    projectPlan.markModified("github");
    return existingNumber;
  }

  const created = await octokit.rest.issues.create(payload);
  issueMap.set(normalizedTask.id, { issueNumber: created.data.number });
  projectPlan.github = {
    ...github,
    issueMap,
    lastSyncedAt: new Date(),
  };
  projectPlan.markModified("github");
  return created.data.number;
}

async function syncProjectIssuesToGitHub(
  octokit: Octokit,
  projectPlan: IProjectPlan,
): Promise<{ synced: number; created: number; updated: number }> {
  const issues = await ProjectIssue.find({
    projectPlanId: projectPlan._id,
  });

  let created = 0;
  let updated = 0;

  for (const issue of issues) {
    const hadIssue = Boolean(issue.githubIssueNumber);
    const issueNumber = await syncIssueToGitHub(octokit, projectPlan, issue);
    if (!issue.githubIssueNumber) {
      issue.githubIssueNumber = issueNumber;
      await issue.save();
      created += 1;
    } else if (hadIssue) {
      updated += 1;
    }
  }

  return { synced: issues.length, created, updated };
}

export async function syncProjectPlanToGitHub(
  octokit: Octokit,
  projectPlan: IProjectPlan,
): Promise<{
  synced: number;
  created: number;
  updated: number;
  milestones: { synced: number; created: number; updated: number };
  issues: { synced: number; created: number; updated: number };
  project: { synced: number };
}> {
  if (!projectPlan.github?.owner || !projectPlan.github.repo) {
    throw new Error("GitHub repository not linked");
  }

  await reconcileGitHubBeforeSync(octokit, projectPlan);

  const milestoneResult = await syncMilestonesToGitHub(octokit, projectPlan);

  const { plan: normalizedPlan, changed } = normalizePlanForGitHub(
    projectPlan.plan,
  );
  if (changed) {
    projectPlan.plan = normalizedPlan;
    projectPlan.markModified("plan");
  }

  const tasks = flattenTasks(normalizedPlan);
  const issueMap = getLocalIssueMap(projectPlan.github);

  let taskCreated = 0;
  let taskUpdated = 0;

  for (const task of tasks) {
    const hadIssue = issueMap.has(task.id);
    const issueNumber = await syncTaskToGitHub(octokit, projectPlan, task);
    if (hadIssue) {
      taskUpdated += 1;
    } else {
      taskCreated += 1;
    }
    issueMap.set(task.id, { issueNumber });
  }

  const issueResult = await syncProjectIssuesToGitHub(octokit, projectPlan);

  let projectResult = { synced: 0 };
  try {
    projectResult = await syncBoardItemsToGitHubProject(octokit, projectPlan);
  } catch (error) {
    if (isGitHubProjectScopeError(error)) {
      console.error(
        "GitHub project sync skipped: reconnect GitHub to grant the project scope.",
        error,
      );
    } else {
      console.error("GitHub project sync failed:", error);
    }
  }

  projectPlan.github = {
    ...projectPlan.github,
    enabled: true,
    issueMap,
    lastSyncedAt: new Date(),
  };
  projectPlan.markModified("github");
  await projectPlan.save();

  return {
    synced: tasks.length + issueResult.synced,
    created: taskCreated + issueResult.created,
    updated: taskUpdated + issueResult.updated,
    milestones: milestoneResult,
    issues: issueResult,
    project: projectResult,
  };
}

export async function syncSingleTaskById(
  octokit: Octokit,
  projectPlan: IProjectPlan,
  taskId: string,
): Promise<void> {
  if (!projectPlan.github?.enabled) {
    return;
  }

  await syncMilestonesToGitHub(octokit, projectPlan);

  const { plan: normalizedPlan, changed } = normalizePlanForGitHub(
    projectPlan.plan,
  );
  if (changed) {
    projectPlan.plan = normalizedPlan;
    projectPlan.markModified("plan");
  }

  const task = flattenTasks(normalizedPlan).find((item) => item.id === taskId);
  if (!task) {
    return;
  }

  await syncTaskToGitHub(octokit, projectPlan, task);
  try {
    await syncBoardItemsToGitHubProject(octokit, projectPlan);
  } catch (error) {
    if (isGitHubProjectScopeError(error)) {
      console.error(
        "GitHub project item sync skipped: reconnect GitHub to grant the project scope.",
        error,
      );
    } else {
      console.error("GitHub project item sync failed:", error);
    }
  }
  await projectPlan.save();
}
