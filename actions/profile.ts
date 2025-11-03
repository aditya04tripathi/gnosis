"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";

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

  if (!aiProvider || !["gemini", "openai", "anthropic"].includes(aiProvider)) {
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
        aiProvider: "gemini",
        theme: "system",
      };
    }

    user.preferences.aiProvider = aiProvider as "gemini" | "openai" | "anthropic";
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

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      return { error: "Current password is incorrect" };
    }

    // Hash and update new password
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

  const gemini = (formData.get("gemini") as string) || null;
  const openai = (formData.get("openai") as string) || null;
  const anthropic = (formData.get("anthropic") as string) || null;
  const groq = (formData.get("groq") as string) || null;

  try {
    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return { error: "User not found" };
    }

    if (!user.apiKeys) {
      user.apiKeys = {
        gemini: undefined,
        openai: undefined,
        anthropic: undefined,
        groq: undefined,
      };
    }

    // Only update keys that have values or are empty strings (to clear them)
    if (gemini !== null) {
      user.apiKeys.gemini = gemini.trim() || undefined;
    }
    if (openai !== null) {
      user.apiKeys.openai = openai.trim() || undefined;
    }
    if (anthropic !== null) {
      user.apiKeys.anthropic = anthropic.trim() || undefined;
    }
    if (groq !== null) {
      user.apiKeys.groq = groq.trim() || undefined;
    }

    await user.save();

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/ai");
    return { success: true };
  } catch (error) {
    console.error("Update API keys error:", error);
    return { error: "Failed to update API keys" };
  }
}
