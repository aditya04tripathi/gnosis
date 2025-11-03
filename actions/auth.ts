"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth, signOut as authSignOut, signIn } from "@/auth";
import connectDB from "@/lib/db";
import Invoice from "@/models/Invoice";
import ProjectPlanModel from "@/models/ProjectPlan";
import ScrumBoard from "@/models/ScrumBoard";
import User from "@/models/User";
import Validation from "@/models/Validation";

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
    await User.create({
      email,
      name,
      password: hashedPassword,
      subscriptionTier: "FREE",
      searchesUsed: 0,
      searchesResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

export async function signInAction(formData: FormData) {
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
    return { success: true, redirectTo: "/dashboard" };
  } catch (error) {
    console.error("Sign in error:", error);
    return { error: "Invalid email or password" };
  }
}

export async function signOutAction() {
  await authSignOut();
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
    await Invoice.deleteMany({ userId: session.user.id });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/pricing");

    return { success: true };
  } catch (error) {
    console.error("Delete account error:", error);
    return { error: "Failed to delete account" };
  }
}
