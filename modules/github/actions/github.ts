"use server";

import { revalidatePath } from "next/cache";
import { isGitHubConfigured } from "@/modules/github/lib/github-config";
import { getGitHubScopeStatus } from "@/modules/github/lib/github-scope-status";
import {
  deleteGitHubWebhook,
  ensureGitHubWebhook,
  removeGitHubWebhookForLinkedRepo,
} from "@/modules/github/lib/github-webhooks";
import { getOctokitForUser } from "@/modules/github/lib/octokit";
import { getGitHubRepository } from "@/modules/github/lib/repository";
import {
  getGitHubSyncStatus,
  requestGitHubSync,
} from "@/modules/github/lib/sync-queue";
import { ensureMilestonesFromRoadmap } from "@/modules/project/lib/milestones-from-roadmap";
import { auth } from "@/modules/shared/lib/auth";
import connectDB from "@/modules/shared/lib/db";
import GitHubSyncJob from "@/modules/shared/models/GitHubSyncJob";
import ProjectPlan from "@/modules/shared/models/ProjectPlan";
import User from "@/modules/shared/models/User";

async function getOwnedProjectPlan(projectPlanId: string, userId: string) {
  await connectDB();
  const projectPlan = await ProjectPlan.findById(projectPlanId);
  if (!projectPlan || projectPlan.userId.toString() !== userId) {
    return null;
  }
  return projectPlan;
}

export async function getGitHubConnectionStatus() {
  const session = await auth();
  if (!session?.user?.id) {
    return { connected: false, configured: isGitHubConfigured() };
  }

  await connectDB();
  const user = await User.findById(session.user.id).select(
    "+githubAccessToken githubUsername githubConnectedAt githubScopes",
  );

  const connected = Boolean(user?.githubUsername && user?.githubAccessToken);
  let scopeStatus = {
    scopes: [] as string[],
    missing: [] as string[],
    hasRequiredScopes: false,
    reconnectMessage: null as string | null,
  };

  if (connected && user?.githubAccessToken) {
    scopeStatus = await getGitHubScopeStatus(session.user.id);
  }

  return {
    connected,
    configured: isGitHubConfigured(),
    username: user?.githubUsername ?? null,
    connectedAt: user?.githubConnectedAt?.toISOString() ?? null,
    scopes: scopeStatus.scopes,
    missingScopes: scopeStatus.missing,
    needsReconnect: connected && !scopeStatus.hasRequiredScopes,
    reconnectMessage: scopeStatus.reconnectMessage,
  };
}

export async function getProjectGitHubSyncStatus(projectPlanId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const projectPlan = await getOwnedProjectPlan(projectPlanId, session.user.id);
  if (!projectPlan) {
    return { error: "Project plan not found" };
  }

  const status = await getGitHubSyncStatus(projectPlanId);
  return { success: true, ...status };
}

export async function linkGitHubRepository(
  projectPlanId: string,
  owner: string,
  repo: string,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const trimmedOwner = owner.trim();
  const trimmedRepo = repo.trim().replace(/\.git$/, "");

  if (!trimmedOwner || !trimmedRepo) {
    return { error: "Repository owner and name are required" };
  }

  try {
    const projectPlan = await getOwnedProjectPlan(
      projectPlanId,
      session.user.id,
    );
    if (!projectPlan) {
      return { error: "Project plan not found" };
    }

    const octokit = await getOctokitForUser(session.user.id);
    const repository = await getGitHubRepository(
      octokit,
      trimmedOwner,
      trimmedRepo,
    );

    const previousGithub = projectPlan.github;
    if (
      previousGithub?.webhookId &&
      previousGithub.owner &&
      previousGithub.repo &&
      (previousGithub.owner !== repository.owner ||
        previousGithub.repo !== repository.repo)
    ) {
      try {
        await deleteGitHubWebhook(
          octokit,
          previousGithub.owner,
          previousGithub.repo,
          previousGithub.webhookId,
        );
      } catch (error) {
        console.error("Failed to remove previous GitHub webhook:", error);
      }
    }

    let webhookId: number | undefined;
    try {
      const registeredWebhookId = await ensureGitHubWebhook(
        octokit,
        repository.owner,
        repository.repo,
      );
      webhookId = registeredWebhookId ?? undefined;
    } catch (error) {
      console.error("Failed to register GitHub webhook:", error);
    }

    projectPlan.github = {
      owner: repository.owner,
      repo: repository.repo,
      enabled: true,
      webhookId,
      lastSyncedAt: undefined,
      issueMap: projectPlan.github?.issueMap ?? new Map(),
      milestoneMap: projectPlan.github?.milestoneMap ?? new Map(),
      project: projectPlan.github?.project,
    };
    projectPlan.markModified("github");

    ensureMilestonesFromRoadmap(projectPlan);
    await projectPlan.save();

    const { jobId } = await requestGitHubSync({
      projectPlanId,
      userId: session.user.id,
      type: "full",
    });

    revalidatePath(`/project/${projectPlanId}`);
    return {
      success: true,
      queued: true,
      jobId,
    };
  } catch (error) {
    console.error("Link GitHub repository error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to link GitHub repository",
    };
  }
}

export async function unlinkGitHubRepository(projectPlanId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const projectPlan = await getOwnedProjectPlan(
      projectPlanId,
      session.user.id,
    );
    if (!projectPlan) {
      return { error: "Project plan not found" };
    }

    if (projectPlan.github?.owner && projectPlan.github.repo) {
      try {
        const octokit = await getOctokitForUser(session.user.id);
        await removeGitHubWebhookForLinkedRepo(octokit, {
          owner: projectPlan.github.owner,
          repo: projectPlan.github.repo,
          webhookId: projectPlan.github.webhookId,
        });
      } catch (error) {
        console.error("Failed to remove GitHub webhook:", error);
      }
    }

    await GitHubSyncJob.deleteMany({
      projectPlanId,
      status: { $in: ["pending", "running"] },
    });

    projectPlan.github = undefined;
    projectPlan.markModified("github");
    await projectPlan.save();
    revalidatePath(`/project/${projectPlanId}`);
    return { success: true };
  } catch (error) {
    console.error("Unlink GitHub repository error:", error);
    return { error: "Failed to unlink repository" };
  }
}

export async function syncProjectWithGitHub(projectPlanId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const projectPlan = await getOwnedProjectPlan(
      projectPlanId,
      session.user.id,
    );
    if (!projectPlan) {
      return { error: "Project plan not found" };
    }

    if (!projectPlan.github?.owner || !projectPlan.github.repo) {
      return { error: "Link a GitHub repository first" };
    }

    const octokit = await getOctokitForUser(session.user.id);
    await getGitHubRepository(
      octokit,
      projectPlan.github.owner,
      projectPlan.github.repo,
    );

    const { jobId } = await requestGitHubSync({
      projectPlanId,
      userId: session.user.id,
      type: "full",
    });

    revalidatePath(`/project/${projectPlanId}`);
    return { success: true, queued: true, jobId };
  } catch (error) {
    console.error("Sync project with GitHub error:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to sync with GitHub",
    };
  }
}

export async function pushTaskToGitHub(
  projectPlanId: string,
  _taskId: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }

  try {
    const projectPlan = await getOwnedProjectPlan(
      projectPlanId,
      session.user.id,
    );
    if (!projectPlan?.github?.enabled) {
      return;
    }

    await requestGitHubSync({
      projectPlanId,
      userId: session.user.id,
      type: "inbound",
    });
  } catch (error) {
    console.error("Pull from GitHub after task change error:", error);
  }
}

export async function pushIssueToGitHub(
  projectPlanId: string,
  _issueId: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }

  try {
    const projectPlan = await getOwnedProjectPlan(
      projectPlanId,
      session.user.id,
    );
    if (!projectPlan?.github?.enabled) {
      return;
    }

    await requestGitHubSync({
      projectPlanId,
      userId: session.user.id,
      type: "inbound",
    });
  } catch (error) {
    console.error("Pull from GitHub after issue change error:", error);
  }
}

export async function pushMilestonesToGitHub(
  projectPlanId: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }

  try {
    const projectPlan = await getOwnedProjectPlan(
      projectPlanId,
      session.user.id,
    );
    if (!projectPlan?.github?.enabled) {
      return;
    }

    await requestGitHubSync({
      projectPlanId,
      userId: session.user.id,
      type: "inbound",
    });
  } catch (error) {
    console.error("Pull from GitHub after milestone change error:", error);
  }
}
