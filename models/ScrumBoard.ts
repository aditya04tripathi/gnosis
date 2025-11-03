import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IScrumBoard extends Document {
  projectPlanId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  taskStatuses: Map<string, "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED">;
  createdAt: Date;
  updatedAt: Date;
}

const ScrumBoardSchema = new Schema<IScrumBoard>(
  {
    projectPlanId: {
      type: Schema.Types.ObjectId,
      ref: "ProjectPlan",
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    taskStatuses: {
      type: Map,
      of: {
        type: String,
        enum: ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"],
      },
      default: new Map(),
    },
  },
  {
    timestamps: true,
  },
);

ScrumBoardSchema.index({ projectPlanId: 1 });
ScrumBoardSchema.index({ userId: 1 });

const ScrumBoard: Model<IScrumBoard> =
  mongoose.models?.ScrumBoard ||
  mongoose.model<IScrumBoard>("ScrumBoard", ScrumBoardSchema);

export default ScrumBoard;
