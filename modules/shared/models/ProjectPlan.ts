import mongoose, { type Document, type Model, Schema } from "mongoose";
import type { ProjectPlan } from "@/modules/validation/types/validation.types";

export interface IProjectPlan extends Document {
  validationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  plan: ProjectPlan;
  alternativeIdeas: Array<{
    title: string;
    description: string;
    score: number;
    reasoning: string;
  }>;
  github?: {
    owner: string;
    repo: string;
    enabled: boolean;
    lastSyncedAt?: Date;
    issueMap: Map<string, { issueNumber: number }>;
    milestoneMap?: Map<string, { number: number }>;
    project?: {
      id: string;
      number: number;
      url: string;
      statusFieldId: string;
      statusOptions: Map<string, string>;
      itemMap?: Map<string, { itemId: string }>;
    };
    syncStatus?: {
      jobId: string;
      status: "queued" | "running" | "completed" | "failed";
      stage?: string;
      progress?: { current: number; total: number };
      error?: string;
      startedAt?: Date;
      completedAt?: Date;
    };
  };
  milestones?: Array<{
    id: string;
    title: string;
    description: string;
    dueDate?: Date;
    status: "open" | "closed";
    phaseId?: string;
  }>;
  teamMembers?: Array<{
    userId?: mongoose.Types.ObjectId;
    email: string;
    role: "owner" | "admin" | "member" | "viewer";
    name?: string;
    invitedAt: Date;
  }>;
  issueCounter?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema({
  id: String,
  title: String,
  description: String,
  status: {
    type: String,
    enum: ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"],
    default: "TODO",
  },
  priority: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH"],
    default: "MEDIUM",
  },
  assignee: String,
  dueDate: Date,
  tags: [String],
  phaseId: String,
});

const PhaseSchema = new Schema({
  id: String,
  name: String,
  description: String,
  duration: String,
  dependencies: [String],
  tasks: [TaskSchema],
});

const ProjectPlanDataSchema = new Schema({
  phases: [PhaseSchema],
  estimatedDuration: String,
  estimatedCost: String,
  riskLevel: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH"],
  },
  priority: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH"],
  },
});

const AlternativeIdeaSchema = new Schema({
  title: String,
  description: String,
  score: Number,
  reasoning: String,
});

const GitHubProjectItemMapSchema = new Schema(
  {
    itemId: String,
  },
  { _id: false },
);

const GitHubProjectSchema = new Schema(
  {
    id: String,
    number: Number,
    url: String,
    statusFieldId: String,
    statusOptions: {
      type: Map,
      of: String,
      default: {},
    },
    itemMap: {
      type: Map,
      of: GitHubProjectItemMapSchema,
      default: {},
    },
  },
  { _id: false, id: false },
);

const GitHubMilestoneMapSchema = new Schema(
  {
    number: Number,
  },
  { _id: false },
);

const GitHubIssueMapSchema = new Schema(
  {
    issueNumber: Number,
  },
  { _id: false },
);

const ProjectPlanSchema = new Schema<IProjectPlan>(
  {
    validationId: {
      type: Schema.Types.ObjectId,
      ref: "Validation",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: ProjectPlanDataSchema,
      required: true,
    },
    alternativeIdeas: {
      type: [AlternativeIdeaSchema],
      default: [],
    },
    github: {
      type: {
        owner: String,
        repo: String,
        enabled: { type: Boolean, default: false },
        lastSyncedAt: Date,
        issueMap: {
          type: Map,
          of: GitHubIssueMapSchema,
          default: {},
        },
        milestoneMap: {
          type: Map,
          of: GitHubMilestoneMapSchema,
          default: {},
        },
        project: {
          type: GitHubProjectSchema,
          default: undefined,
        },
        syncStatus: {
          type: {
            jobId: String,
            status: {
              type: String,
              enum: ["queued", "running", "completed", "failed"],
            },
            stage: String,
            progress: {
              current: Number,
              total: Number,
            },
            error: String,
            startedAt: Date,
            completedAt: Date,
          },
          default: undefined,
        },
      },
      default: undefined,
    },
    milestones: {
      type: [
        {
          id: String,
          title: String,
          description: String,
          dueDate: Date,
          status: { type: String, enum: ["open", "closed"], default: "open" },
          phaseId: String,
        },
      ],
      default: [],
    },
    teamMembers: {
      type: [
        {
          userId: { type: Schema.Types.ObjectId, ref: "User" },
          email: String,
          role: {
            type: String,
            enum: ["owner", "admin", "member", "viewer"],
            default: "member",
          },
          name: String,
          invitedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    issueCounter: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

ProjectPlanSchema.index({ userId: 1, createdAt: -1 });
ProjectPlanSchema.index({ validationId: 1 });

const ProjectPlanModel: Model<IProjectPlan> =
  mongoose.models?.ProjectPlan ||
  mongoose.model<IProjectPlan>("ProjectPlan", ProjectPlanSchema);

export default ProjectPlanModel;
