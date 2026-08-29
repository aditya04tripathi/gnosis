import mongoose, { type Document, type Model, Schema } from "mongoose";
import type { SubscriptionTier } from "@/modules/auth/types/auth.types";

export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
  subscriptionTier: SubscriptionTier;
  searchesUsed: number;
  searchesResetAt: Date;
  preferences?: {
    aiProvider?: "groq" | "openai" | "gemini" | "anthropic" | "custom" | "ollama";
    customBaseUrl?: string;
    customModel?: string;
    ollamaBaseUrl?: string;
    ollamaModel?: string;
    theme?: "light" | "dark" | "system";
  };
  apiKeys?: {
    gemini?: string;
    openai?: string;
    anthropic?: string;
    groq?: string;
    custom?: string;
  };
  githubAccessToken?: string;
  githubUsername?: string;
  githubConnectedAt?: Date;
  githubScopes?: string[];
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
    searchesUsed: {
      type: Number,
      default: 0,
    },
    searchesResetAt: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days for free users
    },
    preferences: {
      type: {
        aiProvider: {
          type: String,
          enum: ["groq", "openai", "gemini", "anthropic", "custom", "ollama"],
          default: "groq",
        },
        theme: {
          type: String,
          enum: ["light", "dark", "system"],
          default: "system",
        },
        customBaseUrl: { type: String, default: undefined },
        customModel: { type: String, default: undefined },
        ollamaBaseUrl: { type: String, default: undefined },
        ollamaModel: { type: String, default: undefined },
      },
      default: {
        aiProvider: "groq",
        theme: "system",
      },
    },
    apiKeys: {
      type: {
        gemini: { type: String, default: null },
        openai: { type: String, default: null },
        anthropic: { type: String, default: null },
        groq: { type: String, default: null },
        custom: { type: String, default: null },
      },
      default: {
        gemini: null,
        openai: null,
        anthropic: null,
        groq: null,
        custom: null,
      },
    },
    githubAccessToken: { type: String, default: null, select: false },
    githubUsername: { type: String, default: null },
    githubConnectedAt: { type: Date, default: null },
    githubScopes: { type: [String], default: [] },
  },
  {
    timestamps: true,
  },
);

const User: Model<IUser> =
  mongoose.models?.User || mongoose.model<IUser>("User", UserSchema);

export default User;
