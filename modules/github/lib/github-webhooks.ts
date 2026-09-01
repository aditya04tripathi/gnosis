import type { Octokit } from "@octokit/rest";
import { getGitHubWebhookUrl } from "@/modules/github/lib/github-config";

const GNOSIS_WEBHOOK_EVENTS = ["issues", "milestone"] as const;

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status: number }).status === 404
  );
}

function normalizeWebhookUrl(url: string | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`;
  } catch {
    return url.replace(/\/$/, "");
  }
}

async function listRepositoryWebhooks(
  octokit: Octokit,
  owner: string,
  repo: string,
) {
  return octokit.paginate(octokit.rest.repos.listWebhooks, {
    owner,
    repo,
    per_page: 100,
  });
}

export async function ensureGitHubWebhook(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<number | null> {
  const webhookUrl = getGitHubWebhookUrl();
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!webhookUrl || !secret) {
    return null;
  }

  const normalizedTarget = normalizeWebhookUrl(webhookUrl);
  const hooks = await listRepositoryWebhooks(octokit, owner, repo);
  const existing = hooks.find(
    (hook) => normalizeWebhookUrl(hook.config?.url) === normalizedTarget,
  );

  if (existing) {
    return existing.id;
  }

  const { data: created } = await octokit.rest.repos.createWebhook({
    owner,
    repo,
    active: true,
    events: [...GNOSIS_WEBHOOK_EVENTS],
    config: {
      url: webhookUrl,
      content_type: "json",
      secret,
      insecure_ssl: "0",
    },
  });

  return created.id;
}

export async function deleteGitHubWebhook(
  octokit: Octokit,
  owner: string,
  repo: string,
  webhookId?: number,
): Promise<void> {
  if (webhookId) {
    try {
      await octokit.rest.repos.deleteWebhook({
        owner,
        repo,
        hook_id: webhookId,
      });
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
    }
    return;
  }

  const webhookUrl = getGitHubWebhookUrl();
  if (!webhookUrl) {
    return;
  }

  const normalizedTarget = normalizeWebhookUrl(webhookUrl);
  const hooks = await listRepositoryWebhooks(octokit, owner, repo);

  await Promise.all(
    hooks
      .filter(
        (hook) => normalizeWebhookUrl(hook.config?.url) === normalizedTarget,
      )
      .map((hook) =>
        octokit.rest.repos.deleteWebhook({
          owner,
          repo,
          hook_id: hook.id,
        }),
      ),
  );
}

export async function removeGitHubWebhookForLinkedRepo(
  octokit: Octokit,
  github: {
    owner: string;
    repo: string;
    webhookId?: number;
  },
): Promise<void> {
  await deleteGitHubWebhook(
    octokit,
    github.owner,
    github.repo,
    github.webhookId,
  );
}
