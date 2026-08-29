import { NextResponse } from "next/server";
import { getGitHubConfig } from "@/modules/github/lib/github-config";
import { GITHUB_OAUTH_SCOPES } from "@/modules/github/lib/gnosis-attribution";
import { auth } from "@/modules/shared/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  const { clientId, appUrl } = getGitHubConfig();
  if (!clientId) {
    return NextResponse.json(
      { error: "GitHub integration is not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const state = Buffer.from(
    JSON.stringify({
      userId: session.user.id,
      redirectTo,
    }),
  ).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/github/callback`,
    scope: GITHUB_OAUTH_SCOPES,
    state,
  });

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
  );
}
