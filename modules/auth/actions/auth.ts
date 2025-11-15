"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import {
  auth,
  signOut as authSignOut,
  signIn,
} from "@/modules/shared/lib/auth";
import connectDB from "@/modules/shared/lib/db";
import ProjectPlanModel from "@/modules/shared/models/ProjectPlan";
import ScrumBoard from "@/modules/shared/models/ScrumBoard";
import User from "@/modules/shared/models/User";
import Validation from "@/modules/shared/models/Validation";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!email || !name || !password) {
    return { error: "All fields are required" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  try {
    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { error: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date();
    await User.create({
      email,
      name,
      password: hashedPassword,
      subscriptionTier: "FREE",
      searchesUsed: 0,
      searchesResetAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days for free users
      preferences: {
        aiProvider: "gemini",
        theme: "system",
      },
      apiKeys: {
        gemini: null,
        openai: null,
        anthropic: null,
        groq: null,
      },
    });

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/pricing");
    return { success: true, redirectTo: "/dashboard" };
  } catch (error) {
    console.error("Sign up error:", error);
    return { error: "Failed to create account" };
  }
}

export async function signInAction(
  formData: FormData,
  callbackUrl: string = "/dashboard"
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/pricing");
    return { success: true, redirectTo: callbackUrl };
  } catch (error) {
    console.error("Sign in error:", error);
    return { error: "Invalid email or password" };
  }
}

export async function signOutAction() {
  await authSignOut({ redirect: false });
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/pricing");
  return { success: true, redirectTo: "/auth/signin" };
}

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    await connectDB();

    await User.findOneAndDelete({ _id: session.user.id });
    await Validation.deleteMany({ userId: session.user.id });
    await ScrumBoard.deleteMany({ userId: session.user.id });
    await ProjectPlanModel.deleteMany({ userId: session.user.id });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/pricing");

    return { success: true };
  } catch (error) {
    console.error("Delete account error:", error);
    return { error: "Failed to delete account" };
  }
}
