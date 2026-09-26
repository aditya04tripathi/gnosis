import { CheckCircle2, FileText, FolderKanban, Plus, TrendingUp, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Stripe from "stripe";
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
  MONTHLY_SEARCHES_LIMIT,
  SUBSCRIPTION_PLANS,
  getPlanForTier,
  getSearchLimitForTier,
} from "@/modules/shared/constants";
import { auth } from "@/modules/shared/lib/auth";
import connectDB from "@/modules/shared/lib/db";
import User from "@/modules/shared/models/User";
import ProjectPlan from "@/modules/shared/models/ProjectPlan";
import Validation from "@/modules/shared/models/Validation";

export const metadata: Metadata = METADATA.pages.dashboard;

interface DashboardPageProps {
  searchParams?: Promise<{
    checkout?: string;
    plan?: string;
    session_id?: string;
  }>;
}

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  await connectDB();

  let user = await User.findById(session.user.id);
  if (!user) {
    redirect("/auth/signin");
  }

  // Fallback reconciliation for Stripe checkout if webhook was missed/delayed
  if (searchParams.checkout === "success") {
    try {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (secretKey && !secretKey.startsWith("pk_")) {
        const stripe = new Stripe(secretKey);
        let completedSession: Stripe.Checkout.Session | null = null;

        if (searchParams.session_id) {
          completedSession = await stripe.checkout.sessions.retrieve(
            searchParams.session_id,
            { expand: ["subscription"] }
          );
        } else {
          const recent = await stripe.checkout.sessions.list({ limit: 5 });
          completedSession =
            recent.data.find(
              (s) =>
                s.payment_status === "paid" &&
                (s.metadata?.userId === user._id.toString() ||
                  s.customer_email === user.email ||
                  s.customer_details?.email === user.email)
            ) || null;
        }

        if (completedSession && completedSession.payment_status === "paid") {
          const plan = completedSession.metadata?.plan || searchParams.plan;
          const customerId =
            typeof completedSession.customer === "string"
              ? completedSession.customer
              : completedSession.customer?.id;
          const subscriptionId =
            typeof completedSession.subscription === "string"
              ? completedSession.subscription
              : completedSession.subscription?.id;

          if (plan === "monthly") {
            user.subscriptionTier = "MONTHLY";
            user.searchesResetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            if (customerId) user.stripeCustomerId = customerId;
            if (subscriptionId) user.stripeSubscriptionId = subscriptionId;
            await user.save();
          } else if (plan === "yearly") {
            user.subscriptionTier = "YEARLY";
            user.searchesResetAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            if (customerId) user.stripeCustomerId = customerId;
            if (subscriptionId) user.stripeSubscriptionId = subscriptionId;
            await user.save();
          } else if (plan === "credits_10") {
            user.searchesUsed = Math.max(0, (user.searchesUsed || 0) - 10);
            if (customerId) user.stripeCustomerId = customerId;
            await user.save();
          }
        }
      }
    } catch (err) {
      console.error("[dashboard] Failed to reconcile Stripe session:", err);
    }
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

  const projects = await ProjectPlan.find({ userId: user._id })
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();

  const plan = getPlanForTier(user.subscriptionTier);
  const searchLimit = getSearchLimitForTier(user.subscriptionTier);
  const searchesRemaining =
    searchLimit === Infinity
      ? "Unlimited"
      : Math.max(0, searchLimit - searchesUsed);

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1">
        <div className="container mx-auto flex flex-col gap-8">
          {searchParams.checkout === "success" && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Payment successful! Your subscription is now active.</p>
                  <p className="text-xs text-muted-foreground">
                    You are now on the <span className="font-semibold text-foreground">{plan.name}</span> tier with unlocked limits and GitHub integration.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 shrink-0">
                <Link href="/validate">Start Validating</Link>
              </Button>
            </div>
          )}

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
                <CardTitle>{DASHBOARD.stats.searchesRemaining}</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{searchesRemaining}</div>
                <p className="text-xs text-muted-foreground">
                  {user.subscriptionTier === "YEARLY"
                    ? "Unlimited validations on Annual"
                    : user.subscriptionTier === "MONTHLY"
                      ? DASHBOARD.stats.ofMonthlySearches(MONTHLY_SEARCHES_LIMIT)
                      : DASHBOARD.stats.ofFreeSearches(FREE_SEARCHES_LIMIT)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>{DASHBOARD.stats.totalValidations}</CardTitle>
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
                <CardTitle>{DASHBOARD.stats.subscription}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{plan.name}</div>
                <p className="text-xs text-muted-foreground">
                  {user.subscriptionTier === "FREE" ? (
                    <Link
                      href="/pricing"
                      className="text-primary hover:underline"
                    >
                      {DASHBOARD.stats.upgradeText}
                    </Link>
                  ) : (
                    <Link
                      href="/profile"
                      className="text-primary hover:underline"
                    >
                      Manage subscription & billing
                    </Link>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
              <CardDescription>
                Your validated ideas and active projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 && validations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
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
                <div className="space-y-6">
                  {projects.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm">Active projects</h3>
                      {projects.map((project) => (
                        <Link
                          className="block"
                          href={`/project/${project._id}`}
                          key={project._id.toString()}
                        >
                          <Card className="transition-colors hover:bg-muted/50">
                            <CardHeader className="py-3">
                              <CardTitle className="text-base">
                                {project.plan.phases[0]?.name ?? "Project plan"}
                              </CardTitle>
                              <CardDescription>
                                {project.plan.phases.length} phases •{" "}
                                {project.plan.phases.reduce(
                                  (n, p) => n + p.tasks.length,
                                  0,
                                )}{" "}
                                tasks
                                {project.github?.repo
                                  ? ` • ${project.github.owner}/${project.github.repo}`
                                  : ""}
                              </CardDescription>
                            </CardHeader>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {validations.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm">Recent validations</h3>
                      {validations.map((validation) => (
                        <Link
                          className="block"
                          href={`/validation/${validation._id}`}
                          key={validation._id.toString()}
                        >
                          <Card className="transition-colors hover:bg-muted/50">
                            <CardHeader className="py-3">
                              <CardTitle className="line-clamp-2 text-base">
                                {validation.idea.slice(0, 100)}
                                {validation.idea.length > 100 ? "..." : ""}
                              </CardTitle>
                              <CardDescription>
                                Score: {validation.validationResult.score}/100 •{" "}
                                {new Date(validation.createdAt).toLocaleDateString()}
                              </CardDescription>
                            </CardHeader>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
