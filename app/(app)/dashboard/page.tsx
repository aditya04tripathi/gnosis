import {
  AlertCircle,
  FileText,
  Plus,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/modules/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/modules/shared/components/ui/card";
import {
  DASHBOARD,
  FREE_SEARCHES_LIMIT,
  METADATA,
  SUBSCRIPTION_PLANS,
} from "@/modules/shared/constants";
import { auth } from "@/modules/shared/lib/auth";
import connectDB from "@/modules/shared/lib/db";
import User from "@/modules/shared/models/User";
import Validation from "@/modules/shared/models/Validation";

export const metadata: Metadata = METADATA.pages.dashboard;

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  await connectDB();

  const user = await User.findById(session.user.id).lean();
  if (!user) {
    redirect("/auth/signin");
  }

  const now = new Date();
  let searchesUsed = user.searchesUsed;
  if (now > user.searchesResetAt) {
    searchesUsed = 0;
  }

  const validations = await Validation.find({
    userId: user._id,
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const plan = SUBSCRIPTION_PLANS.FREE;
  const searchesRemaining = Math.max(0, plan.searchesPerMonth - searchesUsed);

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1">
        <div className="container mx-auto flex flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1>{DASHBOARD.title}</h1>
              <p className="text-muted-foreground">{DASHBOARD.description}</p>
            </div>
            <Button asChild>
              <Link href="/validate">
                <Plus className="mr-2 h-4 w-4" />
                {DASHBOARD.newValidation}
              </Link>
            </Button>
          </div>

          {}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>
                  {DASHBOARD.stats.searchesRemaining}
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{searchesRemaining}</div>
                <p className="text-xs text-muted-foreground">
                  {user.subscriptionTier === "FREE"
                    ? DASHBOARD.stats.ofFreeSearches(FREE_SEARCHES_LIMIT)
                    : DASHBOARD.stats.ofMonthlySearches(plan.searchesPerMonth)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>
                  {DASHBOARD.stats.totalValidations}
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{validations.length}</div>
                <p className="text-xs text-muted-foreground">
                  {DASHBOARD.stats.allTimeValidations}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>
                  {DASHBOARD.stats.subscription}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{plan.name}</div>
                <p className="text-xs text-muted-foreground">
                  {user.subscriptionTier === "FREE" && (
                    <Link
                      href="/pricing"
                      className="text-primary hover:underline"
                    >
                      {DASHBOARD.stats.upgradeText}
                    </Link>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {}
          <Card>
            <CardHeader>
              <CardTitle>Recent Validations</CardTitle>
              <CardDescription>
                Your latest startup idea validations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {validations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h2>{DASHBOARD.emptyState.title}</h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {DASHBOARD.emptyState.description}
                  </p>
                  <Button asChild>
                    <Link href="/validate">
                      <Plus className="mr-2 h-4 w-4" />
                      {DASHBOARD.emptyState.cta}
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {validations.map((validation) => (
                    <Link
                      key={validation._id.toString()}
                      href={`/validation/${validation._id}`}
                      className="block"
                    >
                      <Card className="transition-colors hover:bg-muted/50">
                        <CardHeader>
                          <CardTitle className="line-clamp-2">
                            {validation.idea.slice(0, 100)}
                            {validation.idea.length > 100 ? "..." : ""}
                          </CardTitle>
                          <CardDescription>
                            Score: {validation.validationResult.score}/100 •{" "}
                            {new Date(
                              validation.createdAt,
                            ).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
