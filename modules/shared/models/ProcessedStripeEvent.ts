import mongoose, { type Model, Schema } from "mongoose";

interface IProcessedStripeEvent {
  eventId: string;
  createdAt: Date;
}

const ProcessedStripeEventSchema = new Schema<IProcessedStripeEvent>(
  { eventId: { type: String, required: true, unique: true, index: true } },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const ProcessedStripeEvent: Model<IProcessedStripeEvent> =
  mongoose.models?.ProcessedStripeEvent ||
  mongoose.model<IProcessedStripeEvent>(
    "ProcessedStripeEvent",
    ProcessedStripeEventSchema,
  );

export default ProcessedStripeEvent;
