import mongoose, { type Document, type Model, Schema } from "mongoose";

export type GitHubSyncJobType =
  | "full"
  | "task"
  | "issue"
  | "milestone"
  | "inbound";

export type GitHubSyncJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export interface IGitHubSyncJob extends Document {
  projectPlanId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: GitHubSyncJobType;
  entityId?: string;
  payload?: Record<string, unknown>;
  status: GitHubSyncJobStatus;
  progress: {
    current: number;
    total: number;
    stage?: string;
  };
  result?: Record<string, unknown>;
  error?: string;
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GitHubSyncJobSchema = new Schema<IGitHubSyncJob>(
  {
    projectPlanId: {
      type: Schema.Types.ObjectId,
      ref: "ProjectPlan",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["full", "task", "issue", "milestone", "inbound"],
      required: true,
    },
    entityId: String,
    payload: Schema.Types.Mixed,
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
      index: true,
    },
    progress: {
      current: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      stage: String,
    },
    result: Schema.Types.Mixed,
    error: String,
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    scheduledAt: { type: Date, default: Date.now, index: true },
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true },
);

GitHubSyncJobSchema.index({ projectPlanId: 1, status: 1, scheduledAt: 1 });
GitHubSyncJobSchema.index({ projectPlanId: 1, type: 1, entityId: 1, status: 1 });

const GitHubSyncJobModel: Model<IGitHubSyncJob> =
  mongoose.models?.GitHubSyncJob ||
  mongoose.model<IGitHubSyncJob>("GitHubSyncJob", GitHubSyncJobSchema);

export default GitHubSyncJobModel;
