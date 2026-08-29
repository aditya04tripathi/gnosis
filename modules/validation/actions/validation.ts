"use server";

import type mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { ensureMilestonesFromRoadmap } from "@/modules/project/lib/milestones-from-roadmap";
import {
  CACHE_TTL,
  FREE_SEARCHES_LIMIT,
  RATE_LIMIT,
  SUBSCRIPTION_PLANS,
  VALIDATE,
} from "@/modules/shared/constants";
import { auth } from "@/modules/shared/lib/auth";
import { getEffectiveSearchLimit, isDevUnlimited } from "@/modules/shared/lib/dev-mode";
import connectDB from "@/modules/shared/lib/db";
import {
  generateAlternativeIdeas,
  generateProjectPlan,
  validateIdea,
} from "@/modules/shared/lib/groq";
import ProjectPlan from "@/modules/shared/models/ProjectPlan";
import ScrumBoard from "@/modules/shared/models/ScrumBoard";
import User from "@/modules/shared/models/User";
import Validation from "@/modules/shared/models/Validation";
import type { ValidationResult } from "@/modules/validation/types/validation.types";

export async function validateStartupIdea(idea: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  if (!idea || idea.trim().length < VALIDATE.minLength) {
    return {
      error: VALIDATE.errorMessages.tooShort,
    };
  }

  try {
    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return { error: "User not found" };
    }

    const plan = SUBSCRIPTION_PLANS.FREE;
    const now = new Date();

    if (now > user.searchesResetAt) {
      user.searchesUsed = 0;
      user.searchesResetAt = new Date(
        now.getTime() + 2 * 24 * 60 * 60 * 1000, // 2 days
      );
      await user.save();
    }

    const searchLimit = getEffectiveSearchLimit(FREE_SEARCHES_LIMIT);

    if (
      !isDevUnlimited() &&
      user.subscriptionTier === "FREE" &&
      user.searchesUsed >= searchLimit
    ) {
      const timeUntilReset = user.searchesResetAt.getTime() - now.getTime();
      const hoursUntilReset = Math.ceil(timeUntilReset / (1000 * 60 * 60));
      const daysUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60 * 24));

      let resetMessage = "Free plan limit reached";
      if (daysUntilReset >= 1) {
        resetMessage += `. Next validation available in ${daysUntilReset} day${
          daysUntilReset !== 1 ? "s" : ""
        }`;
      } else if (hoursUntilReset > 0) {
        resetMessage += `. Next validation available in ${hoursUntilReset} hour${
          hoursUntilReset !== 1 ? "s" : ""
        }`;
      } else {
        resetMessage += `. Next validation available soon`;
      }

      return {
        error: resetMessage,
        upgradeRequired: true,
      };
    }

    const validationResult = await validateIdea(idea);

    user.searchesUsed += 1;
    // Set reset time to 2 days from now for free users
    if (user.subscriptionTier === "FREE") {
      user.searchesResetAt = new Date(
        now.getTime() + 2 * 24 * 60 * 60 * 1000, // 2 days
      );
    }
    await user.save();

    const validation = await Validation.create({
      userId: user._id,
      idea,
      validationResult,
    });

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

    const alternativeIdeas = await generateAlternativeIdeas(validation.idea);

    const plan = await generateProjectPlan(
      validation.idea,
      validation.validationResult,
    );

    projectPlan = await ProjectPlan.create({
      validationId: validation._id,
      userId: validation.userId,
      plan,
      alternativeIdeas,
    });

    ensureMilestonesFromRoadmap(projectPlan);
    await projectPlan.save();

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

    ensureMilestonesFromRoadmap(projectPlan);
    await projectPlan.save();

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

    revalidatePath(`/project/${projectPlanId}`);
    revalidatePath("/dashboard");
    revalidatePath(`/validation/${projectPlan.validationId?.toString()}`);

    return { success: true };
  } catch (error) {
    console.error("Update task error:", error);
    return { error: "Failed to update task" };
  }
}
