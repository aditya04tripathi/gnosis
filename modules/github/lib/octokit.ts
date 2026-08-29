import { Octokit } from "@octokit/rest";
import { GITHUB_API_VERSION } from "@/modules/github/lib/github-config";
import { decryptSecret, encryptSecret } from "@/modules/shared/lib/api-key-crypto";
import connectDB from "@/modules/shared/lib/db";
import User from "@/modules/shared/models/User";

export async function getOctokitForUser(userId: string): Promise<Octokit> {
  await connectDB();
  const user = await User.findById(userId).select("+githubAccessToken");

  if (!user?.githubAccessToken) {
    throw new Error("GitHub account not connected");
  }

  const encrypted = user.githubAccessToken.startsWith("v1:");
  const token = encrypted
    ? decryptSecret(user.githubAccessToken)
    : user.githubAccessToken;
  if (!encrypted) {
    user.githubAccessToken = encryptSecret(token);
    await user.save();
  }

  return new Octokit({
    auth: token,
    request: {
      headers: {
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
      },
    },
  });
}
