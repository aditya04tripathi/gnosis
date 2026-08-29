import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getGitHubConnectionStatus } from "@/modules/github/actions/github";
import { isGitHubConfigured } from "@/modules/github/lib/github-config";
import { getMilestones } from "@/modules/project/actions/milestones";
import { getProjectIssues } from "@/modules/project/actions/issues";
import { getTeamMembers } from "@/modules/project/actions/team";
import { ProjectPageClient } from "@/modules/project/components/project-page-client";
import { auth } from "@/modules/shared/lib/auth";
import connectDB from "@/modules/shared/lib/db";
import ProjectPlan from "@/modules/shared/models/ProjectPlan";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  await connectDB();
  const projectPlan = await ProjectPlan.findById(id).lean();
  if (!projectPlan) return { title: "Project Not Found" };
  return {
    title: "Project",
    description: "Validate, plan, and ship your startup idea",
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  await connectDB();
  const projectPlan = await ProjectPlan.findById(id).lean();
  if (!projectPlan || projectPlan.userId.toString() !== session.user.id) {
    redirect("/dashboard");
  }

  const [issuesResult, milestonesResult, teamResult, githubStatus] =
    await Promise.all([
      getProjectIssues(id),
      getMilestones(id),
      getTeamMembers(id),
      getGitHubConnectionStatus(),
    ]);

  const serializedPlan = JSON.parse(JSON.stringify(projectPlan.plan));
  const phases = serializedPlan.phases.map((p: { id: string; name: string }) => ({
    id: p.id,
    name: p.name,
  }));
  const issues = "issues" in (issuesResult ?? {}) ? issuesResult.issues ?? [] : [];
  const milestones =
    "milestones" in (milestonesResult ?? {})
      ? milestonesResult.milestones ?? []
      : [];
  const members =
    "members" in (teamResult ?? {}) ? teamResult.members ?? [] : [];

  const serializedGithub = projectPlan.github
    ? {
        owner: projectPlan.github.owner,
        repo: projectPlan.github.repo,
        enabled: projectPlan.github.enabled,
        lastSyncedAt: projectPlan.github.lastSyncedAt?.toISOString(),
        syncStatus: projectPlan.github.syncStatus
          ? {
              status: projectPlan.github.syncStatus.status,
              stage: projectPlan.github.syncStatus.stage,
              progress: projectPlan.github.syncStatus.progress,
              error: projectPlan.github.syncStatus.error,
              completedAt:
                projectPlan.github.syncStatus.completedAt?.toISOString(),
            }
          : undefined,
        project: projectPlan.github.project
          ? {
              url: projectPlan.github.project.url,
              number: projectPlan.github.project.number,
            }
          : undefined,
      }
    : null;

  const openIssues = issues.filter(
    (i) => i.status === "open" || i.status === "in_progress",
  ).length;

  return (
    <ProjectPageClient
      estimatedCost={projectPlan.plan.estimatedCost}
      estimatedDuration={projectPlan.plan.estimatedDuration}
      github={serializedGithub}
      githubConfigured={isGitHubConfigured()}
      githubConnected={githubStatus.connected}
      githubUsername={githubStatus.username}
      grantedScopes={githubStatus.scopes}
      issues={issues}
      members={members}
      milestones={milestones}
      missingScopes={githubStatus.missingScopes}
      needsReconnect={githubStatus.needsReconnect}
      openIssues={openIssues}
      phases={phases}
      plan={serializedPlan}
      projectPlanId={id}
      reconnectMessage={githubStatus.reconnectMessage}
      riskLevel={projectPlan.plan.riskLevel}
    />
  );
}
