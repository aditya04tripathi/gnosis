import type { Metadata } from "next";
import { auth } from "@/auth";
import PricingComponent from "@/components/pricing";
import connectDB from "@/lib/db";
import User from "@/models/User";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Choose the perfect plan for your startup validation needs",
  openGraph: {
    title: "Pricing | Startup Validator",
    description: "Choose the perfect plan for your startup validation needs",
  },
};

export default async function PricingPage() {
  const session = await auth();
  let currentPlan = "FREE";
  let hasPaymentMethod = false;

  if (session?.user) {
    await connectDB();
    const user = await User.findById(session.user.id).lean();
    if (user) {
      // If user has a subscription plan (BASIC/PRO), use that
      // Otherwise, use subscriptionTier (MONTHLY/YEARLY billing period for BASIC plan, or FREE)
      if (user.subscriptionPlan) {
        currentPlan = user.subscriptionPlan; // "BASIC" or "PRO"
      } else if (
        user.subscriptionTier === "MONTHLY" ||
        user.subscriptionTier === "YEARLY"
      ) {
        // Legacy users who only have billing period without plan type - assume BASIC
        currentPlan = "BASIC";
      } else {
        currentPlan = user.subscriptionTier || "FREE";
      }
      hasPaymentMethod = user.hasPaymentMethod ?? false;
    }
  }

  return (
    <PricingComponent
      currentPlan={currentPlan}
      hasPaymentMethod={hasPaymentMethod}
    />
  );
}
