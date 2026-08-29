import type { Octokit } from "@octokit/rest";
import { withGnosisByline } from "@/modules/github/lib/gnosis-attribution";
import type { IProjectIssue } from "@/modules/shared/models/ProjectIssue";
import type { IProjectPlan } from "@/modules/shared/models/ProjectPlan";

export async function syncCommentToGitHub(
  octokit: Octokit,
  projectPlan: IProjectPlan,
  issue: IProjectIssue,
  body: string,
): Promise<number | undefined> {
  const github = projectPlan.github;
  if (!github?.owner || !github.repo || !issue.githubIssueNumber) {
    return undefined;
  }

  const response = await octokit.rest.issues.createComment({
    owner: github.owner,
    repo: github.repo,
    issue_number: issue.githubIssueNumber,
    body: withGnosisByline(body),
  });

  return response.data.id;
}

export async function deleteCommentFromGitHub(
  octokit: Octokit,
  projectPlan: IProjectPlan,
  githubCommentId: number,
): Promise<void> {
  const github = projectPlan.github;
  if (!github?.owner || !github.repo) {
    return;
  }

  await octokit.rest.issues.deleteComment({
    owner: github.owner,
    repo: github.repo,
    comment_id: githubCommentId,
  });
}
