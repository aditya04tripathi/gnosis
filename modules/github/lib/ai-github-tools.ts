import { z } from "zod";
import { isGitHubConfigured } from "@/modules/github/lib/github-config";
import { getOctokitForUser } from "@/modules/github/lib/octokit";
import { getGitHubRepository } from "@/modules/github/lib/repository";
import { requestGitHubSync } from "@/modules/github/lib/sync-queue";
import type { IProjectPlan } from "@/modules/shared/models/ProjectPlan";
import User from "@/modules/shared/models/User";
import type { ProjectPlan } from "@/modules/validation/types/validation.types";

export const linkGithubRepositorySchema = z.object({
  owner: z.string().min(1).describe("GitHub owner (username or organization)"),
  repo: z
    .string()
    .min(1)
    .describe("Repository name (created automatically if it does not exist)"),
});

export const syncTaskToGithubSchema = z.object({
  taskId: z.string().optional().describe("Task ID to sync"),
  taskTitle: z
    .string()
    .optional()
    .describe("Task title to match when ID is unknown"),
});

export async function getGitHubContextForAI(
  userId: string,
  projectPlan: IProjectPlan,
) {
  const user = await User.findById(userId).select(
    "githubUsername githubConnectedAt",
  );

  return {
    oauthConfigured: isGitHubConfigured(),
    accountConnected: Boolean(user?.githubUsername),
    githubUsername: user?.githubUsername ?? null,
    repositoryLinked: Boolean(
      projectPlan.github?.owner && projectPlan.github?.repo,
    ),
    repository:
      projectPlan.github?.owner && projectPlan.github?.repo
        ? `${projectPlan.github.owner}/${projectPlan.github.repo}`
        : null,
    syncEnabled: projectPlan.github?.enabled ?? false,
    lastSyncedAt: projectPlan.github?.lastSyncedAt?.toISOString() ?? null,
    projectUrl: projectPlan.github?.project?.url ?? null,
    connectPath: "/api/github/connect",
  };
}

function findTaskId(
  plan: ProjectPlan,
  taskId?: string,
  taskTitle?: string,
): string | null {
  const tasks = plan.phases.flatMap((phase) => phase.tasks);

  if (taskId) {
    const match = tasks.find((task) => task.id === taskId);
    if (match) {
      return match.id;
    }
  }

  if (taskTitle) {
    const normalized = taskTitle.trim().toLowerCase();
    const match = tasks.find(
      (task) => task.title.trim().toLowerCase() === normalized,
    );
    if (match) {
      return match.id;
    }
  }

  return null;
}

export async function executeGetGithubStatus(
  userId: string,
  projectPlan: IProjectPlan,
) {
  return getGitHubContextForAI(userId, projectPlan);
}

export async function executeLinkGithubRepository(
  userId: string,
  projectPlan: IProjectPlan,
  input: z.infer<typeof linkGithubRepositorySchema>,
) {
  if (!isGitHubConfigured()) {
    return {
      success: false,
      error: "GitHub OAuth is not configured on this server",
    };
  }

  const user = await User.findById(userId).select("githubUsername");
  if (!user?.githubUsername) {
    return {
      success: false,
      error:
        "GitHub account not connected. Ask the user to connect GitHub from the project page first.",
      connectPath: "/api/github/connect",
    };
  }

  const owner = input.owner.trim();
  const repo = input.repo.trim().replace(/\.git$/, "");

  const octokit = await getOctokitForUser(userId);
  const repository = await getGitHubRepository(octokit, owner, repo);

  projectPlan.github = {
    owner: repository.owner,
    repo: repository.repo,
    enabled: true,
    lastSyncedAt: undefined,
    issueMap: projectPlan.github?.issueMap ?? new Map(),
    milestoneMap: projectPlan.github?.milestoneMap ?? new Map(),
  };
  projectPlan.markModified("github");
  await projectPlan.save();

  const { jobId } = await requestGitHubSync({
    projectPlanId: String(projectPlan._id),
    userId,
    type: "full",
  });

  return {
    success: true,
    repository: `${repository.owner}/${repository.repo}`,
    queued: true,
    jobId,
  };
}

export async function executeSyncToGithub(
  userId: string,
  projectPlan: IProjectPlan,
) {
  if (!projectPlan.github?.owner || !projectPlan.github.repo) {
    return {
      success: false,
      error: "No GitHub repository linked. Use link_github_repository first.",
    };
  }

  const octokit = await getOctokitForUser(userId);
  await getGitHubRepository(
    octokit,
    projectPlan.github.owner,
    projectPlan.github.repo,
  );

  const { jobId } = await requestGitHubSync({
    projectPlanId: String(projectPlan._id),
    userId,
    type: "full",
  });

  return {
    success: true,
    repository: `${projectPlan.github.owner}/${projectPlan.github.repo}`,
    queued: true,
    jobId,
    direction: "from_github",
  };
}

export async function executeSyncTaskToGithub(
  userId: string,
  projectPlan: IProjectPlan,
  input: z.infer<typeof syncTaskToGithubSchema>,
) {
  if (!projectPlan.github?.owner || !projectPlan.github.repo) {
    return {
      success: false,
      error: "No GitHub repository linked. Use link_github_repository first.",
    };
  }

  const taskId = findTaskId(
    projectPlan.plan,
    input.taskId,
    input.taskTitle,
  );

  if (!taskId) {
    return {
      success: false,
      error: "Task not found in the current plan",
    };
  }

  const { jobId } = await requestGitHubSync({
    projectPlanId: String(projectPlan._id),
    userId,
    type: "inbound",
  });

  const task = projectPlan.plan.phases
    .flatMap((phase) => phase.tasks)
    .find((item) => item.id === taskId);

  return {
    success: true,
    taskId,
    taskTitle: task?.title ?? null,
    repository: `${projectPlan.github.owner}/${projectPlan.github.repo}`,
    queued: true,
    jobId,
  };
}

export async function executeListGithubIssues(
  userId: string,
  projectPlan: IProjectPlan,
) {
  if (!projectPlan.github?.owner || !projectPlan.github.repo) {
    return {
      success: false,
      error: "No GitHub repository linked",
      issues: [],
    };
  }

  const octokit = await getOctokitForUser(userId);
  const { owner, repo } = projectPlan.github;
  const response = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: "all",
    per_page: 30,
    sort: "updated",
    direction: "desc",
  });

  const issues = response.data
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      labels: issue.labels.map((label) =>
        typeof label === "string" ? label : label.name ?? "",
      ),
      url: issue.html_url,
    }));

  return {
    success: true,
    repository: `${owner}/${repo}`,
    count: issues.length,
    issues,
  };
}
