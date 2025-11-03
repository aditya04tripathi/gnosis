import mongoose, { type Document, type Model, Schema } from "mongoose";
import type { SubscriptionTier } from "@/types";

export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
  subscriptionTier: SubscriptionTier;
  subscriptionPlan?: "BASIC" | "PRO";
  searchesUsed: number;
  searchesResetAt: Date;
  paypalSubscriptionId?: string;
  hasPaymentMethod?: boolean;
  preferences?: {
    aiProvider?: "gemini" | "openai" | "anthropic";
    theme?: "light" | "dark" | "system";
  };
  apiKeys?: {
    gemini?: string;
    openai?: string;
    anthropic?: string;
    groq?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    subscriptionTier: {
      type: String,
      enum: ["FREE", "MONTHLY", "YEARLY"],
      default: "FREE",
    },
    subscriptionPlan: {
      type: String,
      enum: ["BASIC", "PRO"],
      default: null,
    },
    searchesUsed: {
      type: Number,
      default: 0,
    },
    searchesResetAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    paypalSubscriptionId: {
      type: String,
      default: null,
    },
    hasPaymentMethod: {
      type: Boolean,
      default: false,
    },
    preferences: {
      type: {
        aiProvider: {
          type: String,
          enum: ["gemini", "openai", "anthropic"],
          default: "gemini",
        },
        theme: {
          type: String,
          enum: ["light", "dark", "system"],
          default: "system",
        },
      },
      default: {
        aiProvider: "gemini",
        theme: "system",
      },
    },
    apiKeys: {
      type: {
        gemini: { type: String, default: null },
        openai: { type: String, default: null },
        anthropic: { type: String, default: null },
        groq: { type: String, default: null },
      },
      default: {
        gemini: null,
        openai: null,
        anthropic: null,
        groq: null,
      },
    },
  },
  {
    timestamps: true,
  },
);

const User: Model<IUser> =
  mongoose.models?.User || mongoose.model<IUser>("User", UserSchema);

export default User;
