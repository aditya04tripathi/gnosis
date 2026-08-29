"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getOctokitForUser } from "@/modules/github/lib/octokit";
import { removeGitHubWebhookForLinkedRepo } from "@/modules/github/lib/github-webhooks";
import { auth } from "@/modules/shared/lib/auth";
import connectDB from "@/modules/shared/lib/db";
import GitHubSyncJob from "@/modules/shared/models/GitHubSyncJob";
import ProjectIssue from "@/modules/shared/models/ProjectIssue";
import ProjectPlan from "@/modules/shared/models/ProjectPlan";
import ScrumBoard from "@/modules/shared/models/ScrumBoard";

export async function deleteProject(projectPlanId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  await connectDB();

  const projectPlan = await ProjectPlan.findById(projectPlanId);
  if (!projectPlan || projectPlan.userId.toString() !== session.user.id) {
    return { error: "Project not found" };
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

  await Promise.all([
    ProjectIssue.deleteMany({ projectPlanId }),
    ScrumBoard.deleteMany({ projectPlanId }),
    GitHubSyncJob.deleteMany({ projectPlanId }),
    ProjectPlan.deleteOne({ _id: projectPlanId }),
  ]);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
