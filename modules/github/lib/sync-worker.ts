import { getOctokitForUser } from "@/modules/github/lib/octokit";
import { getGitHubRepository } from "@/modules/github/lib/repository";
import { syncProjectPlanToGitHub } from "@/modules/github/lib/sync";
import { syncGitHubToGnosis } from "@/modules/github/lib/sync-inbound";
import { updateProjectSyncStatus } from "@/modules/github/lib/sync-queue";
import connectDB from "@/modules/shared/lib/db";
import GitHubSyncJob, {
  type IGitHubSyncJob,
} from "@/modules/shared/models/GitHubSyncJob";
import ProjectPlan from "@/modules/shared/models/ProjectPlan";

let lastProgressUpdate = 0;

async function updateJobProgress(
  job: IGitHubSyncJob,
  current: number,
  total: number,
  stage: string,
) {
  const now = Date.now();
  if (now - lastProgressUpdate < 300 && current < total) {
    return;
  }
  lastProgressUpdate = now;

  await GitHubSyncJob.updateOne(
    { _id: job._id },
    { $set: { progress: { current, total, stage } } },
  );

  await updateProjectSyncStatus(job.projectPlanId.toString(), {
    jobId: String(job._id),
    status: "running",
    stage,
    progress: { current, total },
    startedAt: job.startedAt ?? new Date(),
  });
}

async function executeSyncJob(
  job: IGitHubSyncJob,
  userId: string,
): Promise<Record<string, unknown>> {
  await connectDB();
  const projectPlan = await ProjectPlan.findById(job.projectPlanId);
  if (!projectPlan) {
    throw new Error("Project plan not found");
  }

  if (!projectPlan.github?.owner || !projectPlan.github.repo) {
    throw new Error("GitHub repository not linked");
  }

  const octokit = await getOctokitForUser(userId);
  await getGitHubRepository(
    octokit,
    projectPlan.github.owner,
    projectPlan.github.repo,
  );

  switch (job.type) {
    case "full":
    case "task":
    case "issue":
    case "milestone": {
      await updateJobProgress(job, 0, 2, "Pulling from GitHub");
      const inbound = await syncGitHubToGnosis(
        octokit,
        projectPlan,
        async (current, total) => {
          await updateJobProgress(
            job,
            0,
            2,
            total > 0
              ? `Pulling from GitHub (${current}/${total})`
              : "Pulling from GitHub",
          );
        },
      );

      await updateJobProgress(job, 1, 2, "Pushing to GitHub");
      const outbound = await syncProjectPlanToGitHub(octokit, projectPlan);

      projectPlan.github = {
        ...projectPlan.github,
        enabled: true,
        lastSyncedAt: new Date(),
      };
      projectPlan.markModified("github");
      await projectPlan.save();

      await updateJobProgress(job, 2, 2, "Completed");
      return {
        inbound,
        outbound,
      } as unknown as Record<string, unknown>;
    }

    case "inbound": {
      const payload = job.payload as {
        event?: string;
        action?: string;
        issue?: {
          number: number;
          state: string;
          title: string;
          body: string | null;
          labels: Array<{ name: string }>;
          milestone?: { number: number; title: string } | null;
        };
        milestone?: { number: number; title: string; state: string };
      };

      if (payload.event === "milestone" && payload.milestone) {
        const { applyGithubMilestoneUpdate } = await import(
          "@/modules/github/lib/sync-inbound"
        );
        const changed = await applyGithubMilestoneUpdate(
          projectPlan,
          payload.milestone,
        );
        if (changed) {
          await projectPlan.save();
        }
        return { updated: changed ? "milestone" : "skipped" };
      }

      if (payload.issue) {
        const { applyGithubIssueUpdate } = await import(
          "@/modules/github/lib/sync-inbound"
        );
        const result = await applyGithubIssueUpdate(projectPlan, payload.issue);
        if (result.updated === "task" || result.updated === "imported") {
          await projectPlan.save();
        }
        return { updated: result.updated };
      }

      const inbound = await syncGitHubToGnosis(octokit, projectPlan);
      return inbound as unknown as Record<string, unknown>;
    }

    default:
      throw new Error(`Unknown sync job type: ${job.type}`);
  }
}

export async function processGitHubSyncJobs(
  projectPlanId: string,
  userId: string,
): Promise<void> {
  await connectDB();

  for (;;) {
    const job = await GitHubSyncJob.findOneAndUpdate(
      {
        projectPlanId,
        status: "pending",
        scheduledAt: { $lte: new Date() },
      },
      {
        $set: {
          status: "running",
          startedAt: new Date(),
        },
        $inc: { attempts: 1 },
      },
      { sort: { scheduledAt: 1, createdAt: 1 }, new: true },
    );

    if (!job) {
      break;
    }

    await updateProjectSyncStatus(projectPlanId, {
      jobId: String(job._id),
      status: "running",
      stage: job.progress.stage ?? "Running",
      progress: {
        current: job.progress.current,
        total: job.progress.total,
      },
      startedAt: job.startedAt ?? new Date(),
    });

    try {
      const result = await executeSyncJob(job, userId);
      job.status = "completed";
      job.result = result;
      job.completedAt = new Date();
      job.progress = {
        current: job.progress.total || 1,
        total: job.progress.total || 1,
        stage: "Completed",
      };
      await job.save();

      const hasMore = await GitHubSyncJob.exists({
        projectPlanId,
        status: "pending",
      });

      if (!hasMore) {
        await updateProjectSyncStatus(projectPlanId, {
          jobId: String(job._id),
          status: "completed",
          stage: "Completed",
          progress: {
            current: job.progress.total || 1,
            total: job.progress.total || 1,
          },
          completedAt: new Date(),
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sync job failed";

      if (job.attempts < job.maxAttempts) {
        job.status = "pending";
        job.error = message;
        job.scheduledAt = new Date(Date.now() + job.attempts * 2000);
        await job.save();
        continue;
      }

      job.status = "failed";
      job.error = message;
      job.completedAt = new Date();
      await job.save();

      await updateProjectSyncStatus(projectPlanId, {
        jobId: String(job._id),
        status: "failed",
        error: message,
        completedAt: new Date(),
      });
      break;
    }
  }
}
