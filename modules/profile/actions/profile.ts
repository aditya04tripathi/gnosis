"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { encryptApiKey, type AIKeyProvider } from "@/modules/shared/lib/api-key-crypto";
import { auth } from "@/modules/shared/lib/auth";
import connectDB from "@/modules/shared/lib/db";
import User from "@/modules/shared/models/User";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const name = formData.get("name") as string;

  if (!name || name.trim().length === 0) {
    return { error: "Name is required" };
  }

  try {
    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return { error: "User not found" };
    }

    user.name = name.trim();
    await user.save();

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return {
      success: true,
      user: {
        name: user.name,
      },
    };
  } catch (error) {
    console.error("Update profile error:", error);
    return { error: "Failed to update profile" };
  }
}

export async function updateAIPreferences(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const aiProvider = formData.get("aiProvider") as string;

  const providers = ["groq", "openai", "gemini", "anthropic", "custom", "ollama"] as const;
  if (!providers.includes(aiProvider as (typeof providers)[number])) {
    return { error: "Invalid AI provider" };
  }

  try {
    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return { error: "User not found" };
    }

    if (!user.preferences) {
      user.preferences = {
        aiProvider: "groq",
        theme: "system",
      };
    }

    user.preferences.aiProvider = aiProvider as (typeof providers)[number];
    const customBaseUrl = (formData.get("customBaseUrl") as string | null)?.trim();
    const customModel = (formData.get("customModel") as string | null)?.trim();
    const ollamaBaseUrl = (formData.get("ollamaBaseUrl") as string | null)?.trim();
    const ollamaModel = (formData.get("ollamaModel") as string | null)?.trim();
    if (aiProvider === "custom" || aiProvider === "ollama") {
      const isOllama = aiProvider === "ollama";
      const endpoint = isOllama ? ollamaBaseUrl : customBaseUrl;
      const model = isOllama ? ollamaModel : customModel;
      if (!endpoint || !model || model.length > 128) return { error: "An endpoint and model are required" };
      let url: URL;
      try { url = new URL(endpoint); } catch { return { error: "Enter a valid endpoint URL" }; }
      const hostname = url.hostname.toLowerCase();
      const local = hostname === "localhost" || hostname.endsWith(".local") || /^127\.|^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
      if ((!isOllama && (url.protocol !== "https:" || local)) || (isOllama && (!local || process.env.ALLOW_LOCAL_AI_ENDPOINTS !== "true"))) return { error: isOllama ? "Local Ollama endpoints require ALLOW_LOCAL_AI_ENDPOINTS=true on the server" : "Custom endpoints must use a public HTTPS URL" };
      if (isOllama) { user.preferences.ollamaBaseUrl = url.toString().replace(/\/$/, ""); user.preferences.ollamaModel = model; }
      else { user.preferences.customBaseUrl = url.toString().replace(/\/$/, ""); user.preferences.customModel = model; }
    }
    await user.save();

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/ai");
    return { success: true };
  } catch (error) {
    console.error("Update AI preferences error:", error);
    return { error: "Failed to update AI preferences" };
  }
}

export async function updatePassword(formData: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const { currentPassword, newPassword, confirmPassword } = formData;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All password fields are required" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match" };
  }

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters long" };
  }

  try {
    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return { error: "User not found" };
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      return { error: "Current password is incorrect" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    revalidatePath("/profile");
    revalidatePath("/security");
    return { success: true };
  } catch (error) {
    console.error("Update password error:", error);
    return { error: "Failed to update password" };
  }
}

export async function updateAPIKeys(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const provider = formData.get("provider");
  const apiKey = (formData.get("apiKey") as string | null)?.trim();
  const action = formData.get("action");
  const providers = ["groq", "openai", "gemini", "anthropic", "custom"] as const;

  if (!providers.includes(provider as (typeof providers)[number]) || (action !== "save" && action !== "remove")) {
    return { error: "Invalid API key action" };
  }

  if (action === "save" && (!apiKey || apiKey.length < 16 || apiKey.length > 512)) {
    return { error: "Enter a valid API key" };
  }

  try {
    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return { error: "User not found" };
    }

    user.apiKeys ??= {};
    if (action === "remove") user.apiKeys[provider as AIKeyProvider] = undefined;
    else if (apiKey) user.apiKeys[provider as AIKeyProvider] = encryptApiKey(apiKey);

    await user.save();

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/ai");
    return { success: true, configured: action === "save" };
  } catch (error) {
    console.error("Update API keys error:", error);
    return { error: "Failed to update API keys" };
  }
}
