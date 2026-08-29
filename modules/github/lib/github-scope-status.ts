import { getOctokitForUser } from "@/modules/github/lib/octokit";
import {
  fetchGitHubTokenScopes,
  formatMissingScopesMessage,
  getMissingGitHubScopes,
  hasRequiredGitHubScopes,
} from "@/modules/github/lib/github-scopes";

export function isGitHubProjectScopeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("createProjectV2") ||
    message.includes("read:project") ||
    message.includes("requires one of the following scopes: ['project']")
  );
}

export async function getGitHubScopeStatus(userId: string) {
  try {
    const octokit = await getOctokitForUser(userId);
    const scopes = await fetchGitHubTokenScopes(octokit);
    const missing = getMissingGitHubScopes(scopes);
    return {
      scopes,
      missing,
      hasRequiredScopes: hasRequiredGitHubScopes(scopes),
      reconnectMessage:
        missing.length > 0 ? formatMissingScopesMessage(missing) : null,
    };
  } catch {
    return {
      scopes: [] as string[],
      missing: [] as string[],
      hasRequiredScopes: false,
      reconnectMessage: null,
    };
  }
}
