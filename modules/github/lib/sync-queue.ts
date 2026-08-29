import { after } from "next/server";
import connectDB from "@/modules/shared/lib/db";
import GitHubSyncJob, {
  type GitHubSyncJobType,
} from "@/modules/shared/models/GitHubSyncJob";
import ProjectPlan from "@/modules/shared/models/ProjectPlan";
import { processGitHubSyncJobs } from "@/modules/github/lib/sync-worker";

export async function updateProjectSyncStatus(
  projectPlanId: string,
  status: {
    jobId: string;
    status: "queued" | "running" | "completed" | "failed";
    stage?: string;
    progress?: { current: number; total: number };
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
  },
) {
  await connectDB();
  await ProjectPlan.findByIdAndUpdate(projectPlanId, {
    $set: {
      "github.syncStatus": status,
    },
  });
}

export async function enqueueGitHubSyncJob(input: {
  projectPlanId: string;
  userId: string;
  type: GitHubSyncJobType;
  entityId?: string;
  payload?: Record<string, unknown>;
}): Promise<string> {
  await connectDB();

  if (input.entityId) {
    const existing = await GitHubSyncJob.findOne({
      projectPlanId: input.projectPlanId,
      type: input.type,
      entityId: input.entityId,
      status: { $in: ["pending", "running"] },
    }).sort({ createdAt: -1 });

    if (existing) {
      return String(existing._id);
    }
  }

  if (input.type === "full") {
    const existingFull = await GitHubSyncJob.findOne({
      projectPlanId: input.projectPlanId,
      type: "full",
      status: { $in: ["pending", "running"] },
    }).sort({ createdAt: -1 });

    if (existingFull) {
      return String(existingFull._id);
    }
  }

  const job = await GitHubSyncJob.create({
    projectPlanId: input.projectPlanId,
    userId: input.userId,
    type: input.type,
    entityId: input.entityId,
    payload: input.payload,
    status: "pending",
    progress: { current: 0, total: 0, stage: "Queued" },
    attempts: 0,
    maxAttempts: 3,
    scheduledAt: new Date(),
  });

  await updateProjectSyncStatus(input.projectPlanId, {
    jobId: String(job._id),
    status: "queued",
    stage: "Queued",
    progress: { current: 0, total: 0 },
    startedAt: new Date(),
  });

  return String(job._id);
}

export function triggerGitHubSyncWorker(
  projectPlanId: string,
  userId: string,
): void {
  after(async () => {
    try {
      await processGitHubSyncJobs(projectPlanId, userId);
    } catch (error) {
      console.error("GitHub sync worker error:", error);
      await updateProjectSyncStatus(projectPlanId, {
        jobId: "unknown",
        status: "failed",
        error:
          error instanceof Error ? error.message : "Background sync failed",
        completedAt: new Date(),
      });
    }
  });
}

export async function requestGitHubSync(input: {
  projectPlanId: string;
  userId: string;
  type: GitHubSyncJobType;
  entityId?: string;
  payload?: Record<string, unknown>;
}): Promise<{ jobId: string }> {
  const jobId = await enqueueGitHubSyncJob(input);
  triggerGitHubSyncWorker(input.projectPlanId, input.userId);
  return { jobId };
}

export async function getGitHubSyncStatus(projectPlanId: string) {
  await connectDB();

  const projectPlan = await ProjectPlan.findById(projectPlanId).select(
    "github.syncStatus github.lastSyncedAt github.owner github.repo github.enabled",
  );

  const activeJob = await GitHubSyncJob.findOne({
    projectPlanId,
    status: { $in: ["pending", "running"] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const latestJob = await GitHubSyncJob.findOne({ projectPlanId })
    .sort({ createdAt: -1 })
    .lean();

  return {
    syncStatus: projectPlan?.github?.syncStatus
      ? {
          status: projectPlan.github.syncStatus.status,
          stage: projectPlan.github.syncStatus.stage,
          progress: projectPlan.github.syncStatus.progress,
          error: projectPlan.github.syncStatus.error,
          completedAt:
            projectPlan.github.syncStatus.completedAt?.toISOString(),
        }
      : null,
    lastSyncedAt: projectPlan?.github?.lastSyncedAt?.toISOString() ?? null,
    activeJob: activeJob
      ? {
          id: String(activeJob._id),
          type: activeJob.type,
          status: activeJob.status,
          progress: activeJob.progress,
          error: activeJob.error,
        }
      : null,
    latestJob: latestJob
      ? {
          id: String(latestJob._id),
          type: latestJob.type,
          status: latestJob.status,
          progress: latestJob.progress,
          error: latestJob.error,
          completedAt: latestJob.completedAt?.toISOString() ?? null,
        }
      : null,
  };
}
