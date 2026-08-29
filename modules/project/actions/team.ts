"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import type { TeamMemberData, TeamRole } from "@/modules/project/types/project.types";
import { auth } from "@/modules/shared/lib/auth";
import connectDB from "@/modules/shared/lib/db";
import ProjectPlan from "@/modules/shared/models/ProjectPlan";
import User from "@/modules/shared/models/User";

export async function getTeamMembers(projectPlanId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  await connectDB();
  const plan = await ProjectPlan.findById(projectPlanId);
  if (!plan || plan.userId.toString() !== session.user.id) {
    return { error: "Project not found" };
  }

  const owner = await User.findById(plan.userId).select("name email");
  const members: TeamMemberData[] = [
    {
      userId: plan.userId.toString(),
      email: owner?.email ?? "",
      name: owner?.name,
      role: "owner",
      invitedAt: plan.createdAt.toISOString(),
    },
    ...(plan.teamMembers ?? []).map((m) => ({
      userId: m.userId?.toString(),
      email: m.email,
      name: m.name,
      role: m.role,
      invitedAt: m.invitedAt.toISOString(),
    })),
  ];

  return { members };
}

export async function inviteTeamMember(
  projectPlanId: string,
  email: string,
  role: TeamRole = "member",
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

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.includes("@")) {
    return { error: "Invalid email address" };
  }

  const existing = plan.teamMembers?.find((m) => m.email === normalizedEmail);
  if (existing) {
    return { error: "Member already invited" };
  }

  const invitedUser = await User.findOne({ email: normalizedEmail });

  plan.teamMembers = [
    ...(plan.teamMembers ?? []),
    {
      userId: invitedUser?._id
        ? new mongoose.Types.ObjectId(String(invitedUser._id))
        : undefined,
      email: normalizedEmail,
      name: invitedUser?.name,
      role,
      invitedAt: new Date(),
    },
  ];
  plan.markModified("teamMembers");
  await plan.save();

  revalidatePath(`/project/${projectPlanId}`);
  return { success: true };
}
