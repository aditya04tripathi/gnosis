"use server";

import { nanoid } from "nanoid";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import type {
  IssueStatus,
  IssueType,
  ProjectIssueData,
} from "@/modules/project/types/project.types";
import { auth } from "@/modules/shared/lib/auth";
import connectDB from "@/modules/shared/lib/db";
import ProjectIssue, {
  type IProjectIssue,
} from "@/modules/shared/models/ProjectIssue";
import ProjectPlan from "@/modules/shared/models/ProjectPlan";

async function getOwnedPlan(projectPlanId: string, userId: string) {
  await connectDB();
  const plan = await ProjectPlan.findById(projectPlanId);
  if (!plan || plan.userId.toString() !== userId) {
    return null;
  }
  return plan;
}

function serializeIssue(issue: IProjectIssue): ProjectIssueData {
  return {
    _id: issue._id.toString(),
    projectPlanId: issue.projectPlanId.toString(),
    number: issue.number,
    title: issue.title,
    body: issue.body,
    type: issue.type,
    status: issue.status,
    priority: issue.priority,
    labels: issue.labels,
    assigneeEmail: issue.assigneeEmail,
    milestoneId: issue.milestoneId,
    phaseId: issue.phaseId,
    linkedTaskId: issue.linkedTaskId,
    githubIssueNumber: issue.githubIssueNumber,
    comments: issue.comments.map((c) => ({
      id: c.id,
      userId: c.userId.toString(),
      userName: c.userName,
      body: c.body,
      githubCommentId: c.githubCommentId,
      createdAt: c.createdAt.toISOString(),
    })),
    createdBy: issue.userId.toString(),
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
  };
}

export async function getProjectIssues(projectPlanId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const plan = await getOwnedPlan(projectPlanId, session.user.id);
  if (!plan) {
    return { error: "Project not found" };
  }

  const issues = await ProjectIssue.find({ projectPlanId })
    .sort({ number: -1 })
    .lean();

  return {
    issues: issues.map((issue) => ({
      _id: issue._id.toString(),
      projectPlanId: issue.projectPlanId.toString(),
      number: issue.number,
      title: issue.title,
      body: issue.body,
      type: issue.type,
      status: issue.status,
      priority: issue.priority,
      labels: issue.labels,
      assigneeEmail: issue.assigneeEmail,
      milestoneId: issue.milestoneId,
      phaseId: issue.phaseId,
      linkedTaskId: issue.linkedTaskId,
      githubIssueNumber: issue.githubIssueNumber,
      comments: (issue.comments ?? []).map((c) => ({
        id: c.id,
        userId: c.userId.toString(),
        userName: c.userName,
        body: c.body,
        githubCommentId: c.githubCommentId,
        createdAt: new Date(c.createdAt).toISOString(),
      })),
      createdBy: issue.userId.toString(),
      createdAt: new Date(issue.createdAt).toISOString(),
      updatedAt: new Date(issue.updatedAt).toISOString(),
    })),
  };
}

export async function createProjectIssue(
  projectPlanId: string,
  input: {
    title: string;
    body?: string;
    type: IssueType;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    labels?: string[];
    assigneeEmail?: string;
    milestoneId?: string;
    phaseId?: string;
  },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const plan = await getOwnedPlan(projectPlanId, session.user.id);
  if (!plan) {
    return { error: "Project not found" };
  }

  const nextNumber = (plan.issueCounter ?? 0) + 1;
  plan.issueCounter = nextNumber;
  await plan.save();

  const issue = await ProjectIssue.create({
    projectPlanId,
    userId: session.user.id,
    number: nextNumber,
    title: input.title.trim(),
    body: input.body?.trim() ?? "",
    type: input.type,
    status: "open",
    priority: input.priority ?? "MEDIUM",
    labels: input.labels ?? [],
    assigneeEmail: input.assigneeEmail,
    milestoneId: input.milestoneId,
    phaseId: input.phaseId,
    comments: [],
  });

  revalidatePath(`/project/${projectPlanId}`);
  return { success: true, issue: serializeIssue(issue) };
}

export async function updateProjectIssue(
  projectPlanId: string,
  issueId: string,
  updates: {
    title?: string;
    body?: string;
    type?: IssueType;
    status?: IssueStatus;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    labels?: string[];
    assigneeEmail?: string;
    milestoneId?: string;
    phaseId?: string;
  },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const plan = await getOwnedPlan(projectPlanId, session.user.id);
  if (!plan) {
    return { error: "Project not found" };
  }

  const issue = await ProjectIssue.findOne({ _id: issueId, projectPlanId });
  if (!issue) {
    return { error: "Issue not found" };
  }

  if (updates.title !== undefined) issue.title = updates.title.trim();
  if (updates.body !== undefined) issue.body = updates.body.trim();
  if (updates.type !== undefined) issue.type = updates.type;
  if (updates.status !== undefined) issue.status = updates.status;
  if (updates.priority !== undefined) issue.priority = updates.priority;
  if (updates.labels !== undefined) issue.labels = updates.labels;
  if (updates.assigneeEmail !== undefined) {
    issue.assigneeEmail = updates.assigneeEmail;
  }
  if (updates.milestoneId !== undefined) issue.milestoneId = updates.milestoneId;
  if (updates.phaseId !== undefined) issue.phaseId = updates.phaseId;

  await issue.save();

  revalidatePath(`/project/${projectPlanId}`);
  return { success: true, issue: serializeIssue(issue) };
}

export async function addIssueComment(
  projectPlanId: string,
  issueId: string,
  body: string,
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.name) {
    return { error: "Unauthorized" };
  }

  const plan = await getOwnedPlan(projectPlanId, session.user.id);
  if (!plan) {
    return { error: "Project not found" };
  }

  const issue = await ProjectIssue.findOne({ _id: issueId, projectPlanId });
  if (!issue) {
    return { error: "Issue not found" };
  }

  const commentId = nanoid();
  const commentBody = body.trim();

  const comment = {
    id: commentId,
    userId: new mongoose.Types.ObjectId(session.user.id),
    userName: session.user.name,
    body: commentBody,
    createdAt: new Date(),
    githubCommentId: undefined as number | undefined,
  };

  issue.comments.push(comment);
  issue.markModified("comments");
  await issue.save();

  revalidatePath(`/project/${projectPlanId}`);
  return {
    success: true,
    comment: {
      id: comment.id,
      userId: comment.userId.toString(),
      userName: comment.userName,
      body: comment.body,
      githubCommentId: comment.githubCommentId,
      createdAt: comment.createdAt.toISOString(),
    },
  };
}

export async function removeIssueComment(
  projectPlanId: string,
  issueId: string,
  commentId: string,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const plan = await getOwnedPlan(projectPlanId, session.user.id);
  if (!plan) {
    return { error: "Project not found" };
  }

  const issue = await ProjectIssue.findOne({ _id: issueId, projectPlanId });
  if (!issue) {
    return { error: "Issue not found" };
  }

  const comment = issue.comments.find((item) => item.id === commentId);
  if (!comment) {
    return { error: "Comment not found" };
  }

  issue.comments = issue.comments.filter((item) => item.id !== commentId);
  issue.markModified("comments");
  await issue.save();

  revalidatePath(`/project/${projectPlanId}`);
  return { success: true };
}
