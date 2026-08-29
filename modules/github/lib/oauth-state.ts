import crypto from "node:crypto";

const MAX_AGE_MS = 10 * 60 * 1000;

export type GitHubOAuthState = {
  state: string;
  verifier: string;
  redirectTo: string;
  createdAt: number;
};

function secret() {
  const value = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is required for GitHub OAuth");
  return value;
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createGitHubOAuthState(redirectTo: string): GitHubOAuthState {
  return {
    state: crypto.randomBytes(32).toString("base64url"),
    verifier: crypto.randomBytes(48).toString("base64url"),
    redirectTo,
    createdAt: Date.now(),
  };
}

export function createOAuthCookie(state: GitHubOAuthState): string {
  const payload = Buffer.from(JSON.stringify(state)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function parseOAuthCookie(value: string | undefined, state: string): GitHubOAuthState | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as GitHubOAuthState;
    if (parsed.state !== state || Date.now() - parsed.createdAt > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function codeChallenge(verifier: string) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export function safeRedirectPath(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}
