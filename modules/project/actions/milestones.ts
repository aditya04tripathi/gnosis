"use server";

import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import {
  ensureMilestonesFromRoadmap,
  serializeMilestones,
} from "@/modules/project/lib/milestones-from-roadmap";
import type { MilestoneData } from "@/modules/project/types/project.types";
import { auth } from "@/modules/shared/lib/auth";
import connectDB from "@/modules/shared/lib/db";
import ProjectPlan from "@/modules/shared/models/ProjectPlan";

export async function getMilestones(projectPlanId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  await connectDB();
  const plan = await ProjectPlan.findById(projectPlanId);
  if (!plan || plan.userId.toString() !== session.user.id) {
    return { error: "Project not found" };
  }

  if (ensureMilestonesFromRoadmap(plan)) {
    await plan.save();
  }

  return {
    milestones: serializeMilestones(plan),
  };
}

export async function createMilestone(
  projectPlanId: string,
  input: { title: string; description?: string; dueDate?: string; phaseId?: string },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  await connectDB();
  const plan = await ProjectPlan.findById(projectPlanId);
  if (!plan || plan.userId.toString() !== session.user.id) {
    return { error: "Project not found" };
  }

  const milestone = {
    id: nanoid(),
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    status: "open" as const,
    phaseId: input.phaseId,
  };

  plan.milestones = [...(plan.milestones ?? []), milestone];
  plan.markModified("milestones");
  await plan.save();

  revalidatePath(`/project/${projectPlanId}`);
  const serialized: MilestoneData = {
    id: milestone.id,
    title: milestone.title,
    description: milestone.description,
    dueDate: milestone.dueDate?.toISOString(),
    status: milestone.status,
    phaseId: milestone.phaseId,
  };
  return { success: true, milestone: serialized };
}

export async function updateMilestoneStatus(
  projectPlanId: string,
  milestoneId: string,
  status: "open" | "closed",
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  await connectDB();
  const plan = await ProjectPlan.findById(projectPlanId);
  if (!plan || plan.userId.toString() !== session.user.id) {
    return { error: "Project not found" };
  }

  const milestone = plan.milestones?.find((m) => m.id === milestoneId);
  if (!milestone) {
    return { error: "Milestone not found" };
  }

  milestone.status = status;
  plan.markModified("milestones");
  await plan.save();

  revalidatePath(`/project/${projectPlanId}`);
  return { success: true };
}
