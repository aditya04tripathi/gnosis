import { BarChart3, Zap } from "lucide-react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FREE_SEARCHES_LIMIT, SUBSCRIPTION_PLANS } from "@/constants";
import connectDB from "@/lib/db";
import User from "@/models/User";

export const metadata: Metadata = {
  title: "Usage",
  description: "Monitor your usage and limits",
};

export default async function UsagePage() {
  const session = await auth();
  await connectDB();
  const user = await User.findById(session?.user?.id).lean();

  if (!user) {
    return null;
  }

  // Determine plan limits
  let limit: number;
  if (user.subscriptionTier === "FREE") {
    limit = FREE_SEARCHES_LIMIT;
  } else if (user.subscriptionPlan === "BASIC") {
    limit = SUBSCRIPTION_PLANS.BASIC.searchesPerMonth;
  } else if (user.subscriptionPlan === "PRO") {
    limit = Infinity;
  } else {
    // Legacy users with MONTHLY/YEARLY tier
    limit = SUBSCRIPTION_PLANS.BASIC.searchesPerMonth;
  }

  const used = user.searchesUsed || 0;
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);
  const percentage =
    limit === Infinity ? 0 : Math.min(100, (used / limit) * 100);

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1">
        <div className="container mx-auto flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Usage</h1>
              <p className="text-muted-foreground">
                Monitor your AI validation usage and limits
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AI Validations
                </CardTitle>
                <CardDescription>
                  Your current usage this period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Used</span>
                    <span className="text-2xl font-bold">{used}</span>
                  </div>
                  {limit === Infinity ? (
                    <div className="text-sm text-muted-foreground">
                      Unlimited validations available
                    </div>
                  ) : (
                    <>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-medium">
                          {remaining} / {limit}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Plan Details
                </CardTitle>
                <CardDescription>
                  Your current subscription plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <span className="font-medium">
                      {user.subscriptionPlan || user.subscriptionTier || "FREE"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Limit</span>
                    <span className="font-medium">
                      {limit === Infinity
                        ? "Unlimited"
                        : `${limit} validations`}
                    </span>
                  </div>
                  {user.searchesResetAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Resets
                      </span>
                      <span className="font-medium text-sm">
                        {new Date(user.searchesResetAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
