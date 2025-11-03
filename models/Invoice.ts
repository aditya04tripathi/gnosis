import mongoose, { type Document, type Model, Schema } from "mongoose";
import type { SubscriptionTier } from "@/types";

export interface IInvoice extends Document {
  userId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  amount: number;
  currency: string;
  subscriptionTier: SubscriptionTier;
  subscriptionPlan?: "BASIC" | "PRO";
  previousSubscriptionTier?: SubscriptionTier;
  previousSubscriptionPlan?: "BASIC" | "PRO";
  description: string;
  invoiceDate: Date;
  status: "paid" | "pending" | "cancelled" | "refunded";
  paypalSubscriptionId?: string;
  paypalTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
    },
    subscriptionTier: {
      type: String,
      enum: ["FREE", "MONTHLY", "YEARLY"],
      required: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ["BASIC", "PRO"],
    },
    previousSubscriptionTier: {
      type: String,
      enum: ["FREE", "MONTHLY", "YEARLY"],
    },
    previousSubscriptionPlan: {
      type: String,
      enum: ["BASIC", "PRO"],
    },
    description: {
      type: String,
      required: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["paid", "pending", "cancelled", "refunded"],
      required: true,
      default: "paid",
    },
    paypalSubscriptionId: {
      type: String,
    },
    paypalTransactionId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

InvoiceSchema.index({ userId: 1, createdAt: -1 });

const Invoice: Model<IInvoice> =
  mongoose.models?.Invoice ||
  mongoose.model<IInvoice>("Invoice", InvoiceSchema);

export default Invoice;
