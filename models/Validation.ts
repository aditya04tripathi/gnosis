import mongoose, { type Document, type Model, Schema } from "mongoose";
import type { ValidationResult } from "@/types";

export interface IValidation extends Document {
  userId: mongoose.Types.ObjectId;
  idea: string;
  validationResult: ValidationResult;
  projectPlanId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ValidationResultSchema = new Schema({
  isValid: Boolean,
  score: Number,
  feedback: String,
  strengths: [String],
  weaknesses: [String],
  suggestions: [String],
  recommendedTier: String,
  marketAnalysis: String,
  competition: [String],
  targetAudience: String,
});

const ValidationSchema = new Schema<IValidation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    idea: {
      type: String,
      required: true,
    },
    validationResult: {
      type: ValidationResultSchema,
      required: true,
    },
    projectPlanId: {
      type: Schema.Types.ObjectId,
      ref: "ProjectPlan",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ValidationSchema.index({ userId: 1, createdAt: -1 });

const Validation: Model<IValidation> =
  mongoose.models?.Validation ||
  mongoose.model<IValidation>("Validation", ValidationSchema);

export default Validation;
