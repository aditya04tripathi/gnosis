import type { Metadata } from "next";
import { PricingView } from "@/modules/shared/components/pricing-view";
import { APP_INFO, METADATA } from "@/modules/shared/constants";
import { auth } from "@/modules/shared/lib/auth";
import connectDB from "@/modules/shared/lib/db";
import User from "@/modules/shared/models/User";

export const metadata: Metadata = {
  ...METADATA.default,
  title: `Pricing & Plans | ${APP_INFO.name}`,
  description:
    "Choose the right plan to validate ideas, generate actionable roadmaps, and sync directly with GitHub.",
  openGraph: {
    ...METADATA.default.openGraph,
    title: `Pricing & Plans | ${APP_INFO.name}`,
    description:
      "Choose the right plan to validate ideas, generate actionable roadmaps, and sync directly with GitHub.",
  },
};

export default async function PricingPage() {
  const session = await auth();
  let currentTier: "FREE" | "MONTHLY" | "YEARLY" = "FREE";

  if (session?.user?.id) {
    try {
      await connectDB();
      const user = await User.findById(session.user.id).select("subscriptionTier").lean();
      if (user?.subscriptionTier) {
        currentTier = user.subscriptionTier;
      }
    } catch (error) {
      console.error("Failed to load user tier in PricingPage:", error);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <PricingView
            currentTier={currentTier}
            isAuthenticated={Boolean(session?.user)}
          />
        </div>
      </main>
    </div>
  );
}
