import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getGitHubConfig } from "@/modules/github/lib/github-config";
import { parseOAuthCookie } from "@/modules/github/lib/oauth-state";
import { encryptSecret } from "@/modules/shared/lib/api-key-crypto";
import connectDB from "@/modules/shared/lib/db";
import User from "@/modules/shared/models/User";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const { clientId, clientSecret, appUrl } = getGitHubConfig();

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/dashboard?github=not-configured", request.url),
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      new URL("/dashboard?github=error", request.url),
    );
  }

  const cookieStore = await cookies();
  const state = parseOAuthCookie(
    cookieStore.get("github-oauth-state")?.value,
    stateParam,
  );
  if (!state) {
    return NextResponse.redirect(
      new URL("/dashboard?github=error", request.url),
    );
  }

  try {
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          code_verifier: state.verifier,
          redirect_uri: `${appUrl}/api/github/callback`,
        }),
      },
    );

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      scope?: string;
      error?: string;
    };

    if (!tokenData.access_token) {
      throw new Error(tokenData.error ?? "No access token returned");
    }

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
      },
    });

    const githubUser = (await userResponse.json()) as { login?: string };
    if (!githubUser.login) {
      throw new Error("Failed to fetch GitHub user profile");
    }

    await connectDB();
    const session = await (await import("@/modules/shared/lib/auth")).auth();
    if (!session?.user?.id) throw new Error("OAuth session expired");
    await User.findByIdAndUpdate(session.user.id, {
      githubAccessToken: encryptSecret(tokenData.access_token),
      githubUsername: githubUser.login,
      githubConnectedAt: new Date(),
      githubScopes: tokenData.scope?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
    });

    const redirectUrl = new URL(state.redirectTo, request.url);
    redirectUrl.searchParams.set("github", "connected");
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete("github-oauth-state");
    return response;
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);
    const redirectUrl = new URL(state.redirectTo || "/dashboard", request.url);
    redirectUrl.searchParams.set("github", "error");
    return NextResponse.redirect(redirectUrl);
  }
}
