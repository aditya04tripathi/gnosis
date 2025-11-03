import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Plus,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FREE_SEARCHES_LIMIT, SUBSCRIPTION_PLANS } from "@/constants";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Validation from "@/models/Validation";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View and manage your startup idea validations",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
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

  // Get plan info - FREE is in SUBSCRIPTION_PLANS, otherwise use subscriptionPlan
  const plan = user.subscriptionPlan
    ? SUBSCRIPTION_PLANS[user.subscriptionPlan]
    : SUBSCRIPTION_PLANS.FREE;
  const searchesRemaining = Math.max(0, plan.searchesPerMonth - searchesUsed);

  const params = await searchParams;
  const paymentSuccess = params.payment === "success";

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1">
        <div className="container mx-auto flex flex-col gap-8">
          {/* Payment Success Message */}
          {paymentSuccess && (
            <Alert className="border-primary bg-primary/10">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">
                Payment Successful!
              </AlertTitle>
              <AlertDescription className="text-primary/80">
                Your subscription has been activated. You now have access to all
                premium features.
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your startup validations
              </p>
            </div>
            <Button asChild>
              <Link href="/validate">
                <Plus className="mr-2 h-4 w-4" />
                New Validation
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Searches Remaining
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{searchesRemaining}</div>
                <p className="text-xs text-muted-foreground">
                  {user.subscriptionTier === "FREE"
                    ? `of ${FREE_SEARCHES_LIMIT} free searches`
                    : `of ${plan.searchesPerMonth} monthly searches`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Validations
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{validations.length}</div>
                <p className="text-xs text-muted-foreground">
                  All time validations
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Subscription
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
                      Upgrade to unlock more
                    </Link>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Validations */}
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
                  <h3 className="text-lg font-semibold">No validations yet</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Start validating your startup ideas
                  </p>
                  <Button asChild>
                    <Link href="/validate">
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Validation
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
                          <CardTitle className="line-clamp-2 text-lg">
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
