import type { Octokit } from "@octokit/rest";
import { GITHUB_OAUTH_SCOPES } from "@/modules/github/lib/gnosis-attribution";

export const REQUIRED_GITHUB_SCOPES = [
  "repo",
  "read:user",
  "project",
] as const;

export const IMPLIED_GITHUB_SCOPES: Record<string, string[]> = {
  project: ["read:project"],
};

export const OPTIONAL_GITHUB_SCOPES = ["read:org", "read:project"] as const;

export function parseGitHubScopes(header: string | undefined): string[] {
  if (!header?.trim()) {
    return [];
  }
  return header.split(",").map((scope) => scope.trim()).filter(Boolean);
}

function scopeIsGranted(granted: string[], scope: string): boolean {
  if (granted.includes(scope)) {
    return true;
  }

  for (const [parent, implied] of Object.entries(IMPLIED_GITHUB_SCOPES)) {
    if (implied.includes(scope) && granted.includes(parent)) {
      return true;
    }
  }

  return false;
}

export function getMissingGitHubScopes(granted: string[]): string[] {
  return REQUIRED_GITHUB_SCOPES.filter((scope) => !scopeIsGranted(granted, scope));
}

export function hasRequiredGitHubScopes(granted: string[]): boolean {
  return getMissingGitHubScopes(granted).length === 0;
}

export async function fetchGitHubTokenScopes(
  octokit: Octokit,
): Promise<string[]> {
  const response = await octokit.request("GET /user");
  const scopes = parseGitHubScopes(
    response.headers["x-oauth-scopes"] as string | undefined,
  );
  return scopes;
}

export function getGitHubReconnectUrl(redirectTo: string): string {
  return `/api/github/connect?redirect=${encodeURIComponent(redirectTo)}`;
}

export function formatMissingScopesMessage(missing: string[]): string {
  return `Missing GitHub permissions: ${missing.join(", ")}. Reconnect GitHub to grant access (including Projects). Requested scopes: ${GITHUB_OAUTH_SCOPES}`;
}
