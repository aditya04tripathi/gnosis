import { Octokit } from "@octokit/rest";
import { GITHUB_API_VERSION } from "@/modules/github/lib/github-config";
import connectDB from "@/modules/shared/lib/db";
import User from "@/modules/shared/models/User";

export async function getOctokitForUser(userId: string): Promise<Octokit> {
  await connectDB();
  const user = await User.findById(userId).select("+githubAccessToken");

  if (!user?.githubAccessToken) {
    throw new Error("GitHub account not connected");
  }

  return new Octokit({
    auth: user.githubAccessToken,
    request: {
      headers: {
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
      },
    },
  });
}
