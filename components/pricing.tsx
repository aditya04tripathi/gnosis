"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { downgradeToFree } from "@/actions/payment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PayPalButton } from "./paypal-button";

interface PricingProps {
  currentPlan?: string;
  onHomePage?: boolean;
  hasPaymentMethod?: boolean;
}

export default function Pricing({
  currentPlan = "FREE",
  onHomePage = false,
  hasPaymentMethod = false,
}: PricingProps) {
  const router = useRouter();
  const [isMonthly, setIsMonthly] = useState(true);

  const handleDowngradeToFreeClick = async () => {
    if (
      currentPlan !== "FREE" &&
      (currentPlan === "BASIC" || currentPlan === "PRO")
    ) {
      try {
        const result = await downgradeToFree();
        if (result.error || !result.success) {
          toast.error(result.error || "Failed to downgrade plan");
        } else if (result.data?.user) {
          toast.success("Successfully downgraded to Free plan");
          // Refresh the page to show updated plan
          router.refresh();
        }
      } catch {
        toast.error("Failed to downgrade to free plan");
      }
    }
  };

  const monthlyPrices = {
    FREE: 0,
    BASIC: 19,
    PRO: 49,
  };

  const yearlyPrices = {
    FREE: 0,
    BASIC: 190, // ~17% savings (19 * 10 months)
    PRO: 490, // ~17% savings (49 * 10 months = 490)
  };

  const features = {
    FREE: [
      "5 AI validations",
      "Basic project plans",
      "Flowchart visualization",
    ],
    BASIC: [
      "50 AI validations/month",
      "Advanced project plans",
      "SCRUM boards",
      "Email support",
    ],
    PRO: [
      "Unlimited AI validations",
      "Advanced project plans",
      "SCRUM boards",
      "Priority support",
      "AI plan improvements",
      "Export capabilities",
    ],
  };

  return (
    <section>
      <div className="container mx-auto">
        <div className="mx-auto w-full space-y-6 text-center">
          <h1 className="text-center text-4xl font-semibold lg:text-5xl">
            Pricing that Scales with You
          </h1>
          <p className="text-muted-foreground">
            Choose the perfect plan for your startup validation needs. Switch
            between monthly and yearly billing.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <Label
              htmlFor="billing-toggle"
              className={!isMonthly ? "text-muted-foreground" : ""}
            >
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={!isMonthly}
              onCheckedChange={(checked) => setIsMonthly(!checked)}
            />
            <Label
              htmlFor="billing-toggle"
              className={isMonthly ? "text-muted-foreground" : ""}
            >
              Yearly
            </Label>
            {!isMonthly && (
              <span className="text-sm text-primary font-medium">Save 17%</span>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-3">
          {/* Free Plan */}
          <Card
            className={`flex flex-col ${currentPlan === "FREE" && !onHomePage ? "ring-2 ring-primary border-primary" : ""}`}
          >
            <CardHeader className="shrink-0">
              {currentPlan === "FREE" && !onHomePage && (
                <Badge variant="default" className="mb-2 w-fit bg-primary">
                  Current Plan
                </Badge>
              )}
              <CardTitle className="font-medium">Free</CardTitle>
              <span className="my-3 block text-2xl font-semibold">
                ${monthlyPrices.FREE} / {isMonthly ? "mo" : "yr"}
              </span>
              <CardDescription className="text-sm">
                Perfect for getting started
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0 px-6">
              <Separator className="border-dashed mb-4" />
              <ul className="list-none space-y-3 text-sm flex-1">
                {features.FREE.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="size-4 shrink-0 mt-0.5" />
                    <span className="flex-1 wrap-break-word">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            {!onHomePage && (
              <CardFooter className="shrink-0 mt-auto">
                {currentPlan === "FREE" ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDowngradeToFreeClick}
                  >
                    Switch to Free Plan
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>

          {/* Basic Plan */}
          <Card
            className={`relative flex flex-col  ${currentPlan === "BASIC" && !onHomePage ? "ring-2 ring-primary border-primary" : ""}`}
          >
            <span className="bg-linear-to-r from-primary to-primary/80 absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full px-3 py-1 text-xs font-medium text-primary-foreground ring-1 ring-inset ring-white/20 z-10">
              Popular
            </span>

            <CardHeader className="shrink-0 pt-4">
              {currentPlan === "BASIC" && !onHomePage && (
                <Badge variant="default" className="mb-2 w-fit bg-primary">
                  Current Plan
                </Badge>
              )}
              <CardTitle className="font-medium">Basic</CardTitle>
              <span className="my-3 block text-2xl font-semibold">
                ${isMonthly ? monthlyPrices.BASIC : yearlyPrices.BASIC} /{" "}
                {isMonthly ? "mo" : "yr"}
              </span>
              <CardDescription className="text-sm">
                For growing startups
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0 px-6">
              <Separator className="border-dashed mb-4" />
              <ul className="list-none space-y-3 text-sm flex-1">
                {features.BASIC.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="size-4 shrink-0 mt-0.5" />
                    <span className="flex-1 wrap-break-word">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            {!onHomePage && (
              <CardFooter className="shrink-0 mt-auto">
                {currentPlan === "BASIC" ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <PayPalButton
                    tier={isMonthly ? "MONTHLY" : "YEARLY"}
                    planType="BASIC"
                    hasPaymentMethod={hasPaymentMethod}
                  />
                )}
              </CardFooter>
            )}
          </Card>

          {/* Pro Plan */}
          <Card
            className={`flex flex-col ${currentPlan === "PRO" && !onHomePage ? "ring-2 ring-primary border-primary" : ""}`}
          >
            <CardHeader className="shrink-0">
              {currentPlan === "PRO" && !onHomePage && (
                <Badge variant="default" className="mb-2 w-fit bg-primary">
                  Current Plan
                </Badge>
              )}
              <CardTitle className="font-medium">Pro</CardTitle>
              <span className="my-3 block text-2xl font-semibold">
                ${isMonthly ? monthlyPrices.PRO : yearlyPrices.PRO} /{" "}
                {isMonthly ? "mo" : "yr"}
              </span>
              <CardDescription className="text-sm">
                For serious entrepreneurs
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0 px-6">
              <Separator className="border-dashed mb-4" />
              <ul className="list-none space-y-3 text-sm flex-1">
                {features.PRO.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="size-4 shrink-0 mt-0.5" />
                    <span className="flex-1 wrap-break-word">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            {!onHomePage && (
              <CardFooter className="shrink-0 mt-auto">
                {currentPlan === "PRO" ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <PayPalButton
                    tier={isMonthly ? "MONTHLY" : "YEARLY"}
                    planType="PRO"
                    hasPaymentMethod={hasPaymentMethod}
                  />
                )}
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
