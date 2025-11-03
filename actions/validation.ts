"use server";

import type mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  CACHE_TTL,
  FREE_SEARCHES_LIMIT,
  RATE_LIMIT,
  SUBSCRIPTION_PLANS,
} from "@/constants";
import connectDB from "@/lib/db";
import {
  generateAlternativeIdeas,
  generateProjectPlan,
  validateIdea,
} from "@/lib/groq";
import { getCache, rateLimit, setCache } from "@/lib/redis";
import ProjectPlan from "@/models/ProjectPlan";
import ScrumBoard from "@/models/ScrumBoard";
import User from "@/models/User";
import Validation from "@/models/Validation";
import type { ValidationResult } from "@/types";

export async function validateStartupIdea(idea: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  if (!idea || idea.trim().length < 10) {
    return {
      error: "Please provide a detailed startup idea (at least 10 characters)",
    };
  }

  try {
    await connectDB();

    // Rate limiting
    const rateLimitResult = await rateLimit(
      `validation:${session.user.id}`,
      RATE_LIMIT.VALIDATION.maxRequests,
      RATE_LIMIT.VALIDATION.windowMs,
    );

    if (!rateLimitResult.allowed) {
      return {
        error: `Rate limit exceeded. Please try again after ${new Date(
          rateLimitResult.resetAt,
        ).toLocaleTimeString()}`,
      };
    }

    // Check search limit
    const user = await User.findById(session.user.id);
    if (!user) {
      return { error: "User not found" };
    }

    const plan =
      SUBSCRIPTION_PLANS[
        user.subscriptionTier === "FREE"
          ? "FREE"
          : user.subscriptionPlan || "BASIC"
      ];
    const now = new Date();

    // Reset counter if needed
    if (now > user.searchesResetAt) {
      user.searchesUsed = 0;
      if (user.subscriptionTier === "FREE") {
        user.searchesResetAt = new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000,
        );
      } else if (user.subscriptionTier === "MONTHLY") {
        user.searchesResetAt = new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000,
        );
      } else if (user.subscriptionTier === "YEARLY") {
        user.searchesResetAt = new Date(
          now.getTime() + 365 * 24 * 60 * 60 * 1000,
        );
      }
      await user.save();
    }

    if (
      user.subscriptionTier === "FREE" &&
      user.searchesUsed >= FREE_SEARCHES_LIMIT
    ) {
      return {
        error: "Free plan limit reached",
        upgradeRequired: true,
      };
    }

    if (
      user.searchesUsed >= plan.searchesPerMonth &&
      user.subscriptionTier !== "FREE"
    ) {
      return {
        error: "Subscription limit reached",
        upgradeRequired: true,
      };
    }

    // Check cache
    const cacheKey = `validation:${Buffer.from(idea)
      .toString("base64")
      .slice(0, 50)}`;
    const cached = await getCache<ValidationResult>(cacheKey);
    if (cached) {
      // Still increment user's search count
      user.searchesUsed += 1;
      await user.save();

      // Create validation record
      const validation = await Validation.create({
        userId: user._id,
        idea,
        validationResult: cached,
      });

      revalidatePath("/dashboard");
      revalidatePath("/validate");
      revalidatePath("/usage");
      return {
        success: true,
        validationId: (validation._id as mongoose.Types.ObjectId).toString(),
        validationResult: cached,
        user: {
          searchesUsed: user.searchesUsed,
          subscriptionTier: user.subscriptionTier,
          subscriptionPlan: user.subscriptionPlan,
        },
      };
    }

    // Generate validation
    const validationResult = await validateIdea(idea);

    // Increment search count
    user.searchesUsed += 1;
    await user.save();

    // Save validation
    const validation = await Validation.create({
      userId: user._id,
      idea,
      validationResult,
    });

    // Cache result
    await setCache(cacheKey, validationResult, CACHE_TTL.VALIDATION);

    revalidatePath("/dashboard");
    revalidatePath("/validate");
    revalidatePath("/usage");
    return {
      success: true,
      validationId: (validation._id as mongoose.Types.ObjectId).toString(),
      validationResult,
      user: {
        searchesUsed: user.searchesUsed,
        subscriptionTier: user.subscriptionTier,
        subscriptionPlan: user.subscriptionPlan,
      },
    };
  } catch (error) {
    console.error("Validation error:", error);
    return { error: "Failed to validate idea. Please try again." };
  }
}

export async function generatePlan(validationId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    await connectDB();

    const validation = await Validation.findById(validationId);
    if (!validation || validation.userId.toString() !== session.user.id) {
      return { error: "Validation not found" };
    }

    // Check if plan already exists
    let projectPlan = await ProjectPlan.findOne({
      validationId: validation._id,
    });

    if (projectPlan) {
      return {
        success: true,
        projectPlanId: (projectPlan._id as mongoose.Types.ObjectId).toString(),
        plan: projectPlan.plan,
        alternativeIdeas: projectPlan.alternativeIdeas,
      };
    }

    // Generate alternative ideas
    const alternativeIdeas = await generateAlternativeIdeas(validation.idea);

    // Generate project plan
    const plan = await generateProjectPlan(
      validation.idea,
      validation.validationResult,
    );

    // Save project plan
    projectPlan = await ProjectPlan.create({
      validationId: validation._id,
      userId: validation.userId,
      plan,
      alternativeIdeas,
    });

    // Update validation with project plan reference
    validation.projectPlanId = projectPlan._id as mongoose.Types.ObjectId;
    await validation.save();

    revalidatePath(
      `/project/${(projectPlan._id as mongoose.Types.ObjectId).toString()}`,
    );
    revalidatePath("/dashboard");
    revalidatePath(`/validation/${validationId}`);
    return {
      success: true,
      projectPlanId: (projectPlan._id as mongoose.Types.ObjectId).toString(),
      plan,
      alternativeIdeas,
    };
  } catch (error) {
    console.error("Generate plan error:", error);
    return { error: "Failed to generate project plan. Please try again." };
  }
}

export async function updateTaskStatus(
  projectPlanId: string,
  taskId: string,
  status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED",
) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    await connectDB();

    const projectPlan = await ProjectPlan.findById(projectPlanId);
    if (!projectPlan || projectPlan.userId.toString() !== session.user.id) {
      return { error: "Project plan not found" };
    }

    // Find and update task in ProjectPlan
    let taskFound = false;
    for (const phase of projectPlan.plan.phases) {
      const task = phase.tasks.find((t) => t.id === taskId);
      if (task) {
        task.status = status;
        taskFound = true;
        break;
      }
    }

    if (!taskFound) {
      return { error: "Task not found" };
    }

    await projectPlan.save();

    // Update or create SCRUM board entry
    let scrumBoard = await ScrumBoard.findOne({ projectPlanId });
    if (!scrumBoard) {
      scrumBoard = new ScrumBoard({
        projectPlanId: projectPlan._id,
        userId: session.user.id,
        taskStatuses: new Map(),
      });
    }
    scrumBoard.taskStatuses.set(taskId, status);
    scrumBoard.markModified("taskStatuses");
    await scrumBoard.save();

    // Revalidate paths
    revalidatePath(`/project/${projectPlanId}`);
    revalidatePath("/dashboard");
    revalidatePath(`/validation/${projectPlan.validationId?.toString()}`);

    return { success: true };
  } catch (error) {
    console.error("Update task error:", error);
    return { error: "Failed to update task" };
  }
}

export async function improveProjectPlan(
  projectPlanId: string,
  userRequest: string,
) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return { error: "User not found" };
    }

    // Check if user has remaining searches (use 0.5 credits)
    const searchesRemaining =
      user.subscriptionTier === "FREE"
        ? FREE_SEARCHES_LIMIT - user.searchesUsed
        : Infinity;

    if (searchesRemaining < 0.5) {
      return {
        error: "Insufficient credits. Please upgrade your plan.",
      };
    }

    const projectPlan = await ProjectPlan.findById(projectPlanId);
    if (!projectPlan || projectPlan.userId.toString() !== session.user.id) {
      return { error: "Project plan not found" };
    }

    // Use Groq to improve the plan
    const Groq = (await import("groq-sdk")).default;
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return { error: "GROQ API key not configured" };
    }
    const groqClient = new Groq({
      apiKey,
    });

    const planSummary = JSON.stringify({
      phases: projectPlan.plan.phases.map((p) => ({
        name: p.name,
        description: p.description,
        tasks: p.tasks.map((t) => ({
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
        })),
      })),
      estimatedDuration: projectPlan.plan.estimatedDuration,
      estimatedCost: projectPlan.plan.estimatedCost,
      riskLevel: projectPlan.plan.riskLevel,
    });

    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert project management consultant. Help users improve their project plans based on their requests. Provide actionable suggestions and explanations.`,
        },
        {
          role: "user",
          content: `Current project plan:\n${planSummary}\n\nUser request: ${userRequest}\n\nProvide improvements and suggestions. If the user wants specific changes, explain how to implement them.`,
        },
      ],
      model: "llama-3.1-70b-versatile",
      temperature: 0.7,
      max_tokens: 2000,
    });

    const improvements =
      completion.choices[0]?.message?.content || "No improvements suggested.";

    // Deduct 0.5 credits
    user.searchesUsed = (user.searchesUsed || 0) + 0.5;
    await user.save();

    revalidatePath(`/project/${projectPlanId}`);
    revalidatePath("/dashboard");
    revalidatePath("/usage");

    return {
      success: true,
      improvements,
      updatedPlan: null, // Could be enhanced to actually update the plan
      user: {
        searchesUsed: user.searchesUsed,
        subscriptionTier: user.subscriptionTier,
        subscriptionPlan: user.subscriptionPlan,
      },
    };
  } catch (error) {
    console.error("Improve plan error:", error);
    return { error: "Failed to improve project plan. Please try again." };
  }
}
