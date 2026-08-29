import { type GroqLanguageModelChatOptions } from "@ai-sdk/groq";
import {
  convertToModelMessages,
  isStepCount,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  executeGetGithubStatus,
  executeLinkGithubRepository,
  executeListGithubIssues,
  executeSyncTaskToGithub,
  executeSyncToGithub,
  getGitHubContextForAI,
  linkGithubRepositorySchema,
  syncTaskToGithubSchema,
} from "@/modules/github/lib/ai-github-tools";
import { getOctokitForUser } from "@/modules/github/lib/octokit";
import { requestGitHubSync } from "@/modules/github/lib/sync-queue";
import { FREE_SEARCHES_LIMIT } from "@/modules/shared/constants";
import { getLanguageModel, getOllamaProviderOptions, useOllama } from "@/modules/shared/lib/ai-provider";
import { auth } from "@/modules/shared/lib/auth";
import { getEffectiveSearchLimit, isDevUnlimited } from "@/modules/shared/lib/dev-mode";
import connectDB from "@/modules/shared/lib/db";
import ProjectPlan from "@/modules/shared/models/ProjectPlan";
import User from "@/modules/shared/models/User";
import {
  normalizeProjectPlan,
  projectPlanUpdateSchema,
} from "@/modules/validation/lib/project-plan-update";
import type { ProjectPlan as ProjectPlanType } from "@/modules/validation/types/validation.types";

export const maxDuration = 120;

function buildPlanSummary(plan: ProjectPlanType): string {
  return JSON.stringify(
    {
      phases: plan.phases.map((phase) => ({
        id: phase.id,
        name: phase.name,
        description: phase.description,
        duration: phase.duration,
        dependencies: phase.dependencies,
        tasks: phase.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          tags: task.tags,
          phaseId: task.phaseId,
        })),
      })),
      estimatedDuration: plan.estimatedDuration,
      estimatedCost: plan.estimatedCost,
      riskLevel: plan.riskLevel,
      priority: plan.priority,
    },
    null,
    2,
  );
}

function revalidateProject(projectPlanId: string) {
  revalidatePath(`/project/${projectPlanId}`);
  revalidatePath("/dashboard");
  revalidatePath("/usage");
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { messages?: UIMessage[]; projectPlanId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { messages, projectPlanId } = body;

  if (!projectPlanId || !messages?.length) {
    return Response.json(
      { error: "Missing projectPlanId or messages" },
      { status: 400 },
    );
  }

  try {
    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const searchLimit = getEffectiveSearchLimit(FREE_SEARCHES_LIMIT);
    const searchesRemaining =
      user.subscriptionTier === "FREE"
        ? searchLimit - user.searchesUsed
        : Number.POSITIVE_INFINITY;

    if (!isDevUnlimited() && searchesRemaining < 0.5) {
      return Response.json(
        { error: "Insufficient credits. Please upgrade your plan." },
        { status: 402 },
      );
    }

    const projectPlan = await ProjectPlan.findById(projectPlanId);
    if (!projectPlan || projectPlan.userId.toString() !== session.user.id) {
      return Response.json({ error: "Project plan not found" }, { status: 404 });
    }

    const existingPlan = JSON.parse(
      JSON.stringify(projectPlan.plan),
    ) as ProjectPlanType;

    const githubContext = await getGitHubContextForAI(
      session.user.id,
      projectPlan,
    );

    const result = streamText({
      model: getLanguageModel("fast"),
      system: `You are an expert project management consultant with the ability to edit project plans and interact with GitHub.

## Project plan
Use update_project_plan when the user asks to change, add, remove, or reorganize plan content.
- Preserve existing phase and task IDs when modifying existing items
- Generate new IDs only for new phases or tasks
- Keep task statuses unless the user explicitly asks to change them
- After updating, briefly explain what changed

## GitHub
You can manage GitHub integration with these tools:
- get_github_status — check OAuth, account connection, and linked repository
- link_github_repository — link a repo (creates it if missing)
- sync_to_github — push milestones, tasks as issues, and sync the GitHub Project board
- sync_task_to_github — push a single task by ID or title
- list_github_issues — list issues in the linked repository

GitHub rules:
- If accountConnected is false, tell the user to connect GitHub from the project page before linking a repo
- After plan updates, tasks auto-sync when syncEnabled is true
- Proactively offer to link or sync when the user mentions GitHub, issues, or publishing tasks
- Use the user's githubUsername as the default owner when linking unless they specify otherwise

Current GitHub context:
${JSON.stringify(githubContext, null, 2)}

Current project plan:
${buildPlanSummary(existingPlan)}`,
      messages: await convertToModelMessages(messages),
      temperature: 0.7,
      maxOutputTokens: 8192,
      stopWhen: isStepCount(8),
      tools: {
        update_project_plan: tool({
          description:
            "Apply changes to the user's project plan. Pass the complete updated plan with all phases and tasks.",
          inputSchema: projectPlanUpdateSchema,
          execute: async (input) => {
            const normalizedPlan = normalizeProjectPlan(input, existingPlan);
            projectPlan.plan = normalizedPlan;
            projectPlan.markModified("plan");
            await projectPlan.save();

            if (projectPlan.github?.enabled) {
              try {
                await requestGitHubSync({
                  projectPlanId,
                  userId: session.user.id,
                  type: "full",
                });
              } catch (error) {
                console.error("GitHub sync after plan update failed:", error);
              }
            }

            revalidateProject(projectPlanId);

            return {
              success: true,
              summary: input.summary,
              phaseCount: normalizedPlan.phases.length,
              taskCount: normalizedPlan.phases.reduce(
                (count, phase) => count + phase.tasks.length,
                0,
              ),
              githubSynced: projectPlan.github?.enabled ?? false,
            };
          },
        }),
        get_github_status: tool({
          description:
            "Get GitHub OAuth, account connection, and repository link status for this project.",
          inputSchema: z.object({}),
          execute: async () =>
            executeGetGithubStatus(session.user.id, projectPlan),
        }),
        link_github_repository: tool({
          description:
            "Link this project to a GitHub repository. Creates the repository if it does not exist.",
          inputSchema: linkGithubRepositorySchema,
          execute: async (input) => {
            const result = await executeLinkGithubRepository(
              session.user.id,
              projectPlan,
              input,
            );
            if (result.success) {
              revalidateProject(projectPlanId);
            }
            return result;
          },
        }),
        sync_to_github: tool({
          description:
            "Sync all project plan tasks to GitHub Issues in the linked repository.",
          inputSchema: z.object({}),
          execute: async () => {
            const result = await executeSyncToGithub(
              session.user.id,
              projectPlan,
            );
            if (result.success) {
              revalidateProject(projectPlanId);
            }
            return result;
          },
        }),
        sync_task_to_github: tool({
          description:
            "Sync a single plan task to a GitHub Issue by task ID or title.",
          inputSchema: syncTaskToGithubSchema,
          execute: async (input) => {
            const result = await executeSyncTaskToGithub(
              session.user.id,
              projectPlan,
              input,
            );
            if (result.success) {
              revalidateProject(projectPlanId);
            }
            return result;
          },
        }),
        list_github_issues: tool({
          description:
            "List GitHub Issues in the linked repository for this project.",
          inputSchema: z.object({}),
          execute: async () =>
            executeListGithubIssues(session.user.id, projectPlan),
        }),
      },
      providerOptions: useOllama()
        ? getOllamaProviderOptions("fast")
        : {
            groq: {
              reasoningFormat: "parsed",
              reasoningEffort: "default",
            } satisfies GroqLanguageModelChatOptions,
          },
      onFinish: async () => {
        if (!isDevUnlimited()) {
          await User.updateOne(
            { _id: session.user.id },
            { $inc: { searchesUsed: 0.5 } },
          );
        }
      },
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: true,
    });
  } catch (error) {
    console.error("Improve plan stream error:", error);
    return Response.json(
      { error: "Failed to improve project plan. Please try again." },
      { status: 500 },
    );
  }
}
