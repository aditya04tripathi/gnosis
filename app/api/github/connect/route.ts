import { NextResponse } from "next/server";
import { buildAppRedirect, getGitHubConfig } from "@/modules/github/lib/github-config";
import { GITHUB_OAUTH_SCOPES } from "@/modules/github/lib/gnosis-attribution";
import { codeChallenge, createGitHubOAuthState, createOAuthCookie, safeRedirectPath } from "@/modules/github/lib/oauth-state";
import { auth } from "@/modules/shared/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(buildAppRedirect("/auth/signin"));
  }

  const { clientId, appUrl } = getGitHubConfig();
  if (!clientId) {
    return NextResponse.json(
      { error: "GitHub integration is not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const oauthState = createGitHubOAuthState(safeRedirectPath(searchParams.get("redirect")));

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/github/callback`,
    scope: GITHUB_OAUTH_SCOPES,
    state: oauthState.state,
    code_challenge: codeChallenge(oauthState.verifier),
    code_challenge_method: "S256",
  });

  const response = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
  );
  response.cookies.set("github-oauth-state", createOAuthCookie(oauthState), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/api/github/callback",
  });
  return response;
}
