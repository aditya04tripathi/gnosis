export const GITHUB_API_VERSION =
  process.env.GITHUB_API_VERSION ?? "2026-03-10";

export function getGitHubConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const appUrl =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3000";

  return { clientId, clientSecret, appUrl };
}

export function isGitHubConfigured(): boolean {
  const { clientId, clientSecret } = getGitHubConfig();
  return Boolean(clientId && clientSecret);
}
