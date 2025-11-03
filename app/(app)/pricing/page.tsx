import type { Metadata } from "next";
import { APP_INFO, METADATA } from "@/modules/shared/constants";
import { auth } from "@/modules/shared/lib/auth";
import PricingComponent from "@/modules/payment/components/pricing";
import connectDB from "@/modules/shared/lib/db";
import User from "@/modules/shared/models/User";

export const metadata: Metadata = {
  ...METADATA.default,
  title: `Pricing | ${APP_INFO.name}`,
  description: "Choose the perfect plan for your startup validation needs",
  openGraph: {
    ...METADATA.default.openGraph,
    title: `Pricing | ${APP_INFO.name}`,
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

      if (user.subscriptionPlan) {
        currentPlan = user.subscriptionPlan; 
      } else if (
        user.subscriptionTier === "MONTHLY" ||
        user.subscriptionTier === "YEARLY"
      ) {
        
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
