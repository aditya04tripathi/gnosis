import mongoose, { type HydratedDocument, type Model, Schema } from "mongoose";

export interface IProcessedStripeEvent {
  eventId: string;
  status: "processing" | "failed" | "processed";
  processingStartedAt: Date;
  processedAt?: Date;
  failedAt?: Date;
  failureMessage?: string;
  createdAt: Date;
}

export type ProcessedStripeEventDocument =
  HydratedDocument<IProcessedStripeEvent>;

const ProcessedStripeEventSchema = new Schema<IProcessedStripeEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["processing", "failed", "processed"],
      default: "processing",
      required: true,
    },
    processingStartedAt: { type: Date, default: Date.now, required: true },
    processedAt: { type: Date, default: undefined },
    failedAt: { type: Date, default: undefined },
    failureMessage: { type: String, default: undefined },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const ProcessedStripeEvent: Model<IProcessedStripeEvent> =
  mongoose.models?.ProcessedStripeEvent ||
  mongoose.model<IProcessedStripeEvent>(
    "ProcessedStripeEvent",
    ProcessedStripeEventSchema,
  );

export default ProcessedStripeEvent;
