import mongoose, { type Document, type Model, Schema } from "mongoose";
import type { IssueStatus, IssueType } from "@/modules/project/types/project.types";

export interface IProjectIssue extends Document {
  _id: mongoose.Types.ObjectId;
  projectPlanId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  number: number;
  title: string;
  body: string;
  type: IssueType;
  status: IssueStatus;
  priority: "LOW" | "MEDIUM" | "HIGH";
  labels: string[];
  assigneeEmail?: string;
  milestoneId?: string;
  phaseId?: string;
  linkedTaskId?: string;
  githubIssueNumber?: number;
  comments: Array<{
    id: string;
    userId: mongoose.Types.ObjectId;
    userName: string;
    body: string;
    githubCommentId?: number;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema(
  {
    id: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: String,
    body: String,
    githubCommentId: Number,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ProjectIssueSchema = new Schema<IProjectIssue>(
  {
    projectPlanId: {
      type: Schema.Types.ObjectId,
      ref: "ProjectPlan",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    number: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "" },
    type: {
      type: String,
      enum: ["bug", "feature", "task", "epic", "chore", "docs", "spike"],
      default: "task",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "done", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    labels: { type: [String], default: [] },
    assigneeEmail: String,
    milestoneId: String,
    phaseId: String,
    linkedTaskId: String,
    githubIssueNumber: Number,
    comments: { type: [CommentSchema], default: [] },
  },
  { timestamps: true },
);

ProjectIssueSchema.index({ projectPlanId: 1, number: 1 }, { unique: true });
ProjectIssueSchema.index({ projectPlanId: 1, status: 1 });
ProjectIssueSchema.index({ projectPlanId: 1, type: 1 });

const ProjectIssueModel: Model<IProjectIssue> =
  mongoose.models?.ProjectIssue ||
  mongoose.model<IProjectIssue>("ProjectIssue", ProjectIssueSchema);

export default ProjectIssueModel;
