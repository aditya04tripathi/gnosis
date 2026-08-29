import type { Octokit } from "@octokit/rest";

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status: number }).status === 404
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

export async function getGitHubRepository(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<{ owner: string; repo: string }> {
  try {
    const { data } = await octokit.rest.repos.get({ owner, repo });
    return { owner: data.owner.login, repo: data.name };
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new Error(
        `Repository ${owner}/${repo} was not found on GitHub. Link an existing repository.`,
      );
    }
    throw error;
  }
}

export async function ensureGitHubRepository(
  octokit: Octokit,
  owner: string,
  repo: string,
  description = "Project managed by Gnosis",
): Promise<{ owner: string; repo: string; created: boolean }> {
  try {
    const repository = await getGitHubRepository(octokit, owner, repo);
    return { ...repository, created: false };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("was not found on GitHub")
    ) {
      throw error;
    }
    if (!isNotFoundError(error)) {
      throw error;
    }
  }

  const { data: user } = await octokit.rest.users.getAuthenticated();

  if (owner.toLowerCase() === user.login.toLowerCase()) {
    await octokit.rest.repos.createForAuthenticatedUser({
      name: repo,
      description,
      private: true,
      auto_init: true,
    });
    return { owner: user.login, repo, created: true };
  }

  try {
    await octokit.rest.repos.createInOrg({
      org: owner,
      name: repo,
      description,
      private: true,
      auto_init: true,
    });
    return { owner, repo, created: true };
  } catch (error) {
    throw new Error(
      `Repository ${owner}/${repo} was not found and could not be created: ${getErrorMessage(error)}`,
    );
  }
}
