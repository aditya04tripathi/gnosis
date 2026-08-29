"use server";

import { nanoid } from "nanoid";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { z } from "zod";
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

const issueInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(20_000).optional(),
  type: z.enum(["bug", "feature", "task", "epic", "chore", "docs", "spike"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  labels: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  assigneeEmail: z.string().email().max(254).optional(),
  milestoneId: z.string().max(100).optional(),
  phaseId: z.string().max(100).optional(),
});

const issueUpdateSchema = issueInputSchema.partial().omit({ type: true }).extend({
  type: z.enum(["bug", "feature", "task", "epic", "chore", "docs", "spike"]).optional(),
  status: z.enum(["open", "in_progress", "done", "closed"]).optional(),
});

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

  const parsed = issueInputSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid issue input" };
  const numberedPlan = await ProjectPlan.findOneAndUpdate(
    { _id: projectPlanId, userId: session.user.id },
    { $inc: { issueCounter: 1 } },
    { new: true },
  );
  if (!numberedPlan) return { error: "Project not found" };

  const issue = await ProjectIssue.create({
    projectPlanId,
    userId: session.user.id,
    number: numberedPlan.issueCounter,
    title: parsed.data.title,
    body: parsed.data.body ?? "",
    type: parsed.data.type,
    status: "open",
    priority: parsed.data.priority ?? "MEDIUM",
    labels: parsed.data.labels ?? [],
    assigneeEmail: parsed.data.assigneeEmail,
    milestoneId: parsed.data.milestoneId,
    phaseId: parsed.data.phaseId,
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

  const parsed = issueUpdateSchema.safeParse(updates);
  if (!parsed.success) return { error: "Invalid issue update" };
  const issue = await ProjectIssue.findOne({ _id: issueId, projectPlanId });
  if (!issue) {
    return { error: "Issue not found" };
  }

  if (parsed.data.title !== undefined) issue.title = parsed.data.title;
  if (parsed.data.body !== undefined) issue.body = parsed.data.body;
  if (parsed.data.type !== undefined) issue.type = parsed.data.type;
  if (parsed.data.status !== undefined) issue.status = parsed.data.status;
  if (parsed.data.priority !== undefined) issue.priority = parsed.data.priority;
  if (parsed.data.labels !== undefined) issue.labels = parsed.data.labels;
  if (parsed.data.assigneeEmail !== undefined) {
    issue.assigneeEmail = parsed.data.assigneeEmail;
  }
  if (parsed.data.milestoneId !== undefined) issue.milestoneId = parsed.data.milestoneId;
  if (parsed.data.phaseId !== undefined) issue.phaseId = parsed.data.phaseId;

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
  if (!commentBody || commentBody.length > 10_000) return { error: "Comments must be between 1 and 10,000 characters" };

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
