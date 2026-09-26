"use client";

import { Check, Loader2, Sparkles, Zap, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import {
  CREDITS_PACK,
  SUBSCRIPTION_PLANS,
} from "@/modules/shared/constants";

interface PricingViewProps {
  currentTier?: "FREE" | "MONTHLY" | "YEARLY" | "ULTRA";
  isAuthenticated?: boolean;
}

export function PricingView({
  currentTier = "FREE",
  isAuthenticated = false,
}: PricingViewProps) {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCheckout = async (
    planKey: "monthly" | "yearly" | "ultra_monthly" | "ultra_yearly" | "credits_10",
  ) => {
    if (!isAuthenticated) {
      router.push(`/auth/signup?plan=${planKey}`);
      return;
    }

    setLoadingPlan(planKey);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        const text = await response.text().catch(() => "");
        throw new Error(text || `Server returned ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data?.error || "Failed to start checkout");
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("Checkout URL was not returned by Stripe");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(
        error instanceof Error ? error.message : "Unable to initiate checkout",
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    setLoadingPlan("portal");
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        const text = await response.text().catch(() => "");
        throw new Error(text || `Server returned ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        if (data?.redirectUrl) {
          router.push(data.redirectUrl);
          return;
        }
        throw new Error(data?.error || "Failed to access billing portal");
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Billing portal error:", error);
      toast.error(
        error instanceof Error ? error.message : "Unable to open billing portal",
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  const freePlan = SUBSCRIPTION_PLANS.FREE;
  const proPlan = SUBSCRIPTION_PLANS.MONTHLY;
  const ultraPlan = SUBSCRIPTION_PLANS.ULTRA;

  const faqs = [
    {
      q: "How do validation limits work?",
      a: "The Free plan provides 1 comprehensive AI idea validation every 2 days. The Pro plan provides 50 validations per month (or unlimited on Annual), and the Ultra tier provides completely uncapped validations with zero cooldowns and priority queueing.",
    },
    {
      q: "Can I cancel or change my plan anytime?",
      a: "Yes! You can upgrade, downgrade, or cancel your subscription at any time directly through your billing portal. Your benefits remain active until the end of your billing cycle.",
    },
    {
      q: "How does GitHub integration work with each tier?",
      a: "Free tier users can manually link repositories. Pro and Ultra users unlock full bi-directional synchronization, automated issue and milestone generation, and instant webhook updates.",
    },
    {
      q: "Do purchased validation credits expire?",
      a: "No. Booster credits purchased through our 10-Validation pack never expire and are consumed after your subscription allotment.",
    },
  ];

  const isProUser = currentTier === "MONTHLY" || currentTier === "YEARLY";
  const isUltraUser = currentTier === "ULTRA";

  return (
    <div className="flex flex-col gap-12 py-4">
      {/* Header section */}
      <div className="flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">
        <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" /> Transparent Pricing
        </Badge>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Invest in conviction, not wasted code
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          Validate startup ideas with AI, convert them into executable roadmaps, and sync directly with your GitHub development pipeline.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="flex items-center gap-2 mt-4 bg-muted/60 p-1.5 rounded-full border border-border/60">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
              billingCycle === "monthly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
              billingCycle === "yearly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Annual billing</span>
            <span className="text-[11px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* 3 Tiered Cards */}
      <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto w-full items-stretch">
        {/* Tier 1: Free Starter */}
        <Card
          className={`flex flex-col justify-between relative transition-all border-border/80 ${
            currentTier === "FREE" ? "ring-2 ring-primary/40" : ""
          }`}
        >
          <div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">{freePlan.name}</CardTitle>
                {currentTier === "FREE" && (
                  <Badge variant="outline" className="border-primary/50 text-primary font-medium">
                    Current Plan
                  </Badge>
                )}
              </div>
              <CardDescription className="min-h-[40px] text-xs mt-1">
                {freePlan.description}
              </CardDescription>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">$0</span>
                <span className="text-xs text-muted-foreground">/ forever</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                What's included
              </div>
              <ul className="space-y-2.5 text-sm">
                {freePlan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </div>
          <CardFooter className="pt-4 border-t border-border/40">
            {currentTier === "FREE" ? (
              <Button variant="outline" className="w-full" disabled>
                Active on your account
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageBilling}
                disabled={loadingPlan === "portal"}
              >
                Downgrade in Portal
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Tier 2: Pro */}
        <Card
          className={`flex flex-col justify-between relative transition-all border-primary/50 shadow-md shadow-primary/5 ${
            isProUser ? "ring-2 ring-primary" : ""
          }`}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
              {proPlan.badge}
            </span>
          </div>

          <div>
            <CardHeader className="pb-4 pt-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Pro</CardTitle>
                {isProUser && (
                  <Badge className="bg-primary text-primary-foreground font-medium">
                    Current Plan
                  </Badge>
                )}
              </div>
              <CardDescription className="min-h-[40px] text-xs mt-1">
                {proPlan.description}
              </CardDescription>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">
                  {billingCycle === "monthly" ? "$19" : "$190"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {billingCycle === "monthly" ? (
                    "/ month"
                  ) : (
                    <span>
                      / year <span className="text-emerald-500 font-semibold">($15.83/mo)</span>
                    </span>
                  )}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Everything in Free, plus
              </div>
              <ul className="space-y-2.5 text-sm">
                {proPlan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </div>
          <CardFooter className="pt-4 border-t border-border/40">
            {isProUser ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageBilling}
                disabled={loadingPlan === "portal"}
              >
                {loadingPlan === "portal" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Manage Subscription
              </Button>
            ) : (
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                onClick={() =>
                  handleCheckout(billingCycle === "monthly" ? "monthly" : "yearly")
                }
                disabled={loadingPlan === "monthly" || loadingPlan === "yearly"}
              >
                {loadingPlan === "monthly" || loadingPlan === "yearly" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                {billingCycle === "monthly" ? "Upgrade to Pro" : "Get Pro Annual"}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Tier 3: Ultra */}
        <Card
          className={`flex flex-col justify-between relative transition-all border-border/80 ${
            isUltraUser ? "ring-2 ring-purple-500" : ""
          }`}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
              {ultraPlan.badge}
            </span>
          </div>

          <div>
            <CardHeader className="pb-4 pt-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">{ultraPlan.name}</CardTitle>
                {isUltraUser && (
                  <Badge className="bg-purple-600 text-white font-medium">
                    Current Plan
                  </Badge>
                )}
              </div>
              <CardDescription className="min-h-[40px] text-xs mt-1">
                {ultraPlan.description}
              </CardDescription>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">
                  {billingCycle === "monthly" ? "$49" : "$490"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {billingCycle === "monthly" ? (
                    "/ month"
                  ) : (
                    <span>
                      / year <span className="text-emerald-500 font-semibold">($40.83/mo)</span>
                    </span>
                  )}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                All Pro features, plus
              </div>
              <ul className="space-y-2.5 text-sm">
                {ultraPlan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </div>
          <CardFooter className="pt-4 border-t border-border/40">
            {isUltraUser ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageBilling}
                disabled={loadingPlan === "portal"}
              >
                {loadingPlan === "portal" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Manage Subscription
              </Button>
            ) : (
              <Button
                variant="default"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold"
                onClick={() =>
                  handleCheckout(
                    billingCycle === "monthly" ? "ultra_monthly" : "ultra_yearly",
                  )
                }
                disabled={
                  loadingPlan === "ultra_monthly" || loadingPlan === "ultra_yearly"
                }
              >
                {loadingPlan === "ultra_monthly" || loadingPlan === "ultra_yearly" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {billingCycle === "monthly" ? "Upgrade to Ultra" : "Get Ultra Annual"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Credit Booster Pack section */}
      <div className="max-w-4xl mx-auto w-full">
        <Card className="bg-muted/40 border-border/60">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Badge variant="outline" className="font-semibold">Add-On Pack</Badge>
                <h2 className="font-bold text-lg">{CREDITS_PACK.name}</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {CREDITS_PACK.description} Perfect when you need extra validations without changing your subscription tier.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-2xl font-bold">{CREDITS_PACK.price}</div>
                <div className="text-xs text-muted-foreground">One-time payment</div>
              </div>
              <Button
                variant="secondary"
                onClick={() => handleCheckout("credits_10")}
                disabled={loadingPlan === "credits_10"}
              >
                {loadingPlan === "credits_10" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Buy 10 Credits
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security and Guarantees */}
      <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto w-full text-center">
        <div className="flex flex-col items-center gap-2 p-4">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <h3 className="font-semibold text-sm">Secure Payment</h3>
          <p className="text-xs text-muted-foreground">
            Processed securely with Stripe 256-bit encryption. We never store credit card numbers.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 p-4">
          <Zap className="w-8 h-8 text-primary" />
          <h3 className="font-semibold text-sm">Instant Activation</h3>
          <p className="text-xs text-muted-foreground">
            Your validations and GitHub sync capabilities are unlocked the second payment confirms.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 p-4">
          <HelpCircle className="w-8 h-8 text-primary" />
          <h3 className="font-semibold text-sm">Dedicated Support</h3>
          <p className="text-xs text-muted-foreground">
            Have questions about plans or enterprise setups? Our founder support team is here to assist.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto w-full space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
          <p className="text-sm text-muted-foreground">
            Everything you need to know about Gnosis subscriptions and billing.
          </p>
        </div>
        <div className="grid gap-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="bg-card/50">
              <CardHeader className="py-4">
                <CardTitle className="text-base font-semibold">{faq.q}</CardTitle>
                <CardDescription className="text-sm mt-1 text-muted-foreground">
                  {faq.a}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
