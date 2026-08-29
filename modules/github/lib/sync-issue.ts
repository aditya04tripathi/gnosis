import type { Octokit } from "@octokit/rest";
import { getGitHubConfig } from "@/modules/github/lib/github-config";
import { GNOSIS_BYLINE } from "@/modules/github/lib/gnosis-attribution";
import {
  getGithubMilestoneForGnosisMilestone,
  getGithubMilestoneForPhase,
} from "@/modules/github/lib/sync-milestones";
import {
  findGithubIssueForGnosisIssue,
} from "@/modules/github/lib/sync-reconcile";
import type { IProjectIssue } from "@/modules/shared/models/ProjectIssue";
import type { IProjectPlan } from "@/modules/shared/models/ProjectPlan";
import { ISSUE_TYPE_CONFIG } from "@/modules/project/types/project.types";
import type { IssueType } from "@/modules/project/types/project.types";

function statusToGithubState(status: string): "open" | "closed" {
  return status === "done" || status === "closed" ? "closed" : "open";
}

function resolveIssueMilestone(
  github: NonNullable<IProjectPlan["github"]>,
  issue: IProjectIssue,
): number | undefined {
  if (issue.milestoneId) {
    const fromMilestone = getGithubMilestoneForGnosisMilestone(
      github,
      issue.milestoneId,
    );
    if (fromMilestone) {
      return fromMilestone;
    }
  }

  if (issue.phaseId) {
    return getGithubMilestoneForPhase(github, issue.phaseId);
  }

  return undefined;
}

export async function syncIssueToGitHub(
  octokit: Octokit,
  projectPlan: IProjectPlan,
  issue: IProjectIssue,
): Promise<number> {
  const github = projectPlan.github;
  if (!github?.owner || !github.repo) {
    throw new Error("GitHub repository not linked");
  }

  const { owner, repo } = github;
  const { appUrl } = getGitHubConfig();
  const typeConfig = ISSUE_TYPE_CONFIG[issue.type as IssueType];
  const milestone = resolveIssueMilestone(github, issue);

  const labels = [
    "gnosis",
    `gnosis-${issue.type}`,
    `priority-${issue.priority.toLowerCase()}`,
    ...issue.labels.slice(0, 5),
  ];

  const body = [
    issue.body || "_No description provided._",
    "",
    `| Field | Value |`,
    `| --- | --- |`,
    `| Type | ${typeConfig.label} |`,
    `| Priority | ${issue.priority} |`,
    `| Status | ${issue.status} |`,
    issue.assigneeEmail ? `| Assignee | ${issue.assigneeEmail} |` : null,
    "",
    "---",
    GNOSIS_BYLINE.trim(),
    `Managed in [Gnosis](${appUrl}/project/${projectPlan._id}?issue=${issue.number})`,
  ]
    .filter(Boolean)
    .join("\n");

  const payload = {
    owner,
    repo,
    title: issue.title,
    body,
    labels,
    state: statusToGithubState(issue.status),
    milestone,
  };

  if (issue.githubIssueNumber) {
    await octokit.rest.issues.update({
      ...payload,
      issue_number: issue.githubIssueNumber,
    });
    return issue.githubIssueNumber;
  }

  const existingNumber = await findGithubIssueForGnosisIssue(
    octokit,
    owner,
    repo,
    String(projectPlan._id),
    issue.number,
    issue.title,
  );
  if (existingNumber) {
    await octokit.rest.issues.update({
      ...payload,
      issue_number: existingNumber,
    });
    issue.githubIssueNumber = existingNumber;
    await issue.save();
    return existingNumber;
  }

  const created = await octokit.rest.issues.create(payload);
  issue.githubIssueNumber = created.data.number;
  await issue.save();
  return created.data.number;
}
