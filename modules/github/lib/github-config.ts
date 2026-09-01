export const GITHUB_API_VERSION =
  process.env.GITHUB_API_VERSION ?? "2026-03-10";

export function getGitHubConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const railwayUrl = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : null;
  const appUrl =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    railwayUrl ||
    "http://localhost:3000";

  return { clientId, clientSecret, appUrl };
}

export function buildAppRedirect(path: string): URL {
  const { appUrl } = getGitHubConfig();
  return new URL(path, appUrl);
}

export function isGitHubConfigured(): boolean {
  const { clientId, clientSecret } = getGitHubConfig();
  return Boolean(clientId && clientSecret);
}

export function getGitHubWebhookUrl(): string | null {
  const { appUrl } = getGitHubConfig();

  try {
    const url = new URL(appUrl);
    if (url.protocol !== "https:") {
      return null;
    }
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return null;
    }
    return `${url.origin}/api/github/webhook`;
  } catch {
    return null;
  }
}

export function canRegisterGitHubWebhooks(): boolean {
  return Boolean(getGitHubWebhookUrl() && process.env.GITHUB_WEBHOOK_SECRET);
}
