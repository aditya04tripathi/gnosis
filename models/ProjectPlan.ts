import mongoose, { type Document, type Model, Schema } from "mongoose";
import type { ProjectPlan } from "@/types";

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
  },
  {
    timestamps: true,
  }
);

ProjectPlanSchema.index({ userId: 1, createdAt: -1 });
ProjectPlanSchema.index({ validationId: 1 });

const ProjectPlanModel: Model<IProjectPlan> =
  mongoose.models?.ProjectPlan ||
  mongoose.model<IProjectPlan>("ProjectPlan", ProjectPlanSchema);

export default ProjectPlanModel;
