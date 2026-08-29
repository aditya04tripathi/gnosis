import type { Octokit } from "@octokit/rest";

export async function githubGraphql<T>(
  octokit: Octokit,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  return octokit.graphql<T>(query, variables);
}
