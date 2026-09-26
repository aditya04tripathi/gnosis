import { BarChart3, Zap, ArrowUpRight, Plus, Sparkles, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/modules/shared/components/ui/badge";
import { Button } from "@/modules/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/modules/shared/components/ui/card";
import { Progress } from "@/modules/shared/components/ui/progress";
import {
  CREDITS_PACK,
  FREE_SEARCHES_LIMIT,
  SUBSCRIPTION_PLANS,
  getPlanForTier,
  getSearchLimitForTier,
} from "@/modules/shared/constants";
import { getEffectiveSearchLimit } from "@/modules/shared/lib/dev-mode";
import { auth } from "@/modules/shared/lib/auth";
import connectDB from "@/modules/shared/lib/db";
import User from "@/modules/shared/models/User";

export const metadata: Metadata = {
  title: "Usage & Limits",
  description: "Monitor your AI validation usage, quotas, and subscription details",
};

export default async function UsagePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  await connectDB();
  const user = await User.findById(session.user.id).lean();

  if (!user) {
    redirect("/auth/signin");
  }

  const currentTier = user.subscriptionTier || "FREE";
  const plan = getPlanForTier(currentTier);
  const limit = getSearchLimitForTier(currentTier);

  const used = user.searchesUsed || 0;
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);
  const percentage =
    limit === Infinity ? 0 : Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1">
        <div className="container mx-auto flex flex-col gap-8 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Usage & Quotas</h1>
              <p className="text-muted-foreground text-sm">
                Monitor your startup validations, monthly allotments, and tier features
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline">
                <Link href="/pricing">
                  Compare Plans
                </Link>
              </Button>
              <Button asChild>
                <Link href="/validate">
                  <Plus className="mr-2 h-4 w-4" />
                  New Validation
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Validations Progress Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-primary" />
                    AI Validations
                  </CardTitle>
                  <Badge variant={limit === Infinity ? "secondary" : percentage > 80 ? "destructive" : "outline"}>
                    {limit === Infinity ? "Uncapped" : `${percentage}% Used`}
                  </Badge>
                </div>
                <CardDescription>
                  Validations consumed in the current active period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-extrabold">{used}</span>
                      <span className="text-sm text-muted-foreground ml-1">
                        / {limit === Infinity ? "∞" : limit} validations
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">
                        {limit === Infinity ? "Unlimited" : `${remaining} remaining`}
                      </span>
                    </div>
                  </div>

                  {limit === Infinity ? (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-500 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>You have unlimited validations included on your {plan.name} plan.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Progress value={percentage} className="h-2.5" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>0 validations</span>
                        <span>{limit} monthly limit</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              {currentTier === "FREE" && (
                <CardFooter className="pt-2 border-t border-border/50 bg-muted/20 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Need higher limits and full GitHub sync?</span>
                  <Link href="/pricing" className="text-primary font-medium hover:underline flex items-center gap-1">
                    Upgrade to Pro <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </CardFooter>
              )}
            </Card>

            {/* Plan Details Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Current Plan
                  </CardTitle>
                  <Badge className="font-semibold">{plan.name}</Badge>
                </div>
                <CardDescription>
                  Your current tier and active entitlements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-1 border-b border-border/40 text-sm">
                    <span className="text-muted-foreground">Billing Period</span>
                    <span className="font-medium capitalize">{plan.period}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/40 text-sm">
                    <span className="text-muted-foreground">Quota Model</span>
                    <span className="font-medium">
                      {currentTier === "YEARLY"
                        ? "Unlimited Validations"
                        : currentTier === "MONTHLY"
                          ? "50 / Month"
                          : "1 / 2 Days"}
                    </span>
                  </div>
                  {user.searchesResetAt && (
                    <div className="flex items-center justify-between py-1 border-b border-border/40 text-sm">
                      <span className="text-muted-foreground">Next Quota Reset</span>
                      <span className="font-medium">
                        {new Date(user.searchesResetAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-1 text-sm">
                    <span className="text-muted-foreground">GitHub Two-Way Sync</span>
                    <span className="font-medium flex items-center gap-1.5 text-xs text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      {currentTier === "FREE" ? "Standard Linking" : "Full Bi-directional"}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                {currentTier === "FREE" ? (
                  <Button asChild size="sm" className="w-full">
                    <Link href="/pricing">Upgrade Plan</Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/profile">Manage Subscription in Billing Portal</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* Booster Section */}
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Top-Up Option</Badge>
                <CardTitle className="text-base font-semibold">{CREDITS_PACK.name}</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {CREDITS_PACK.description} Add instant capacity to your account without modifying your current tier.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Get <span className="font-bold text-foreground">10 additional validations</span> for a one-time payment of{" "}
                  <span className="font-bold text-foreground">{CREDITS_PACK.price}</span>.
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/pricing">Purchase Booster</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
