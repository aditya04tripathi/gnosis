"use client";

import { PayPalButtons } from "@paypal/react-paypal-js";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { downgradeToFree } from "@/modules/payment/actions/payment";
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
import { Label } from "@/modules/shared/components/ui/label";
import { Separator } from "@/modules/shared/components/ui/separator";
import { Switch } from "@/modules/shared/components/ui/switch";
import { PayPalButton } from "./paypal-button";

// import { PayPalButton } from "./paypal-button";

interface PricingProps {
  currentPlan?: string;
  onHomePage?: boolean;
}

export default function Pricing({
  currentPlan = "FREE",
  onHomePage = false,
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
    BASIC: 190,
    PRO: 490,
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
    <section className="container mx-auto">
      <div className="w-full">
        {!onHomePage && (
          <div>
            <h1>Pricing</h1>
            <p className="text-muted-foreground">
              Choose the perfect plan for your startup validation needs. Switch
              between monthly and yearly billing.
            </p>
          </div>
        )}

        <div className="mt-20 grid gap-4 sm:gap-6 md:grid-cols-3">
          <Card
            className={`flex flex-col h-full ${currentPlan === "FREE" && !onHomePage ? "ring-2 ring-primary border-primary" : ""}`}
          >
            <CardHeader className="shrink-0">
              {currentPlan === "FREE" && !onHomePage && (
                <Badge variant="default" className="mb-3 w-fit bg-primary">
                  Current Plan
                </Badge>
              )}
              <CardTitle>Free</CardTitle>
              <div className="mt-4 space-y-1">
                <span className="block text-3xl sm:text-4xl font-bold">
                  ${monthlyPrices.FREE}
                </span>
                <span className="text-muted-foreground text-sm">
                  / {isMonthly ? "month" : "year"}
                </span>
              </div>
              <CardDescription className="mt-3">
                Perfect for getting started
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0 px-4 sm:px-6">
              <Separator className="border-dashed mb-4" />
              <ul className="list-none space-y-3 sm:space-y-4 text-sm flex-1">
                {features.FREE.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="size-4 shrink-0 mt-0.5 text-primary" />
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            {!onHomePage && (
              <CardFooter className="shrink-0 mt-auto px-4 sm:px-6 pb-4 sm:pb-6">
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

          <Card
            className={`relative flex flex-col h-full ${currentPlan === "BASIC" && !onHomePage ? "ring-2 ring-primary border-primary" : ""}`}
          >
            <span className="bg-linear-to-r from-primary to-primary/80 absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full px-3 py-1 text-xs font-medium text-primary-foreground ring-1 ring-inset ring-white/20 z-10">
              Popular
            </span>

            <CardHeader className="shrink-0 pt-6">
              {currentPlan === "BASIC" && !onHomePage && (
                <Badge variant="default" className="mb-3 w-fit bg-primary">
                  Current Plan
                </Badge>
              )}
              <CardTitle>Basic</CardTitle>
              <div className="mt-4 space-y-1">
                <span className="block text-3xl sm:text-4xl font-bold">
                  ${isMonthly ? monthlyPrices.BASIC : yearlyPrices.BASIC}
                </span>
                <span className="text-muted-foreground text-sm">
                  / {isMonthly ? "month" : "year"}
                </span>
              </div>
              <CardDescription className="mt-3">
                For growing startups
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0 px-4 sm:px-6">
              <Separator className="border-dashed mb-4" />
              <ul className="list-none space-y-3 sm:space-y-4 text-sm flex-1">
                {features.BASIC.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="size-4 shrink-0 mt-0.5 text-primary" />
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            {!onHomePage && (
              <CardFooter className="shrink-0 mt-auto px-4 sm:px-6 pb-4 sm:pb-6">
                {currentPlan === "BASIC" ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  // <PayPalButton
                  //   tier={isMonthly ? "MONTHLY" : "YEARLY"}
                  //   planType="BASIC"
                  // />
                  <PayPalButton
                    tier={isMonthly ? "MONTHLY" : "YEARLY"}
                    planType="BASIC"
                  />
                )}
              </CardFooter>
            )}
          </Card>

          <Card
            className={`flex flex-col h-full ${currentPlan === "PRO" && !onHomePage ? "ring-2 ring-primary border-primary" : ""}`}
          >
            <CardHeader className="shrink-0">
              {currentPlan === "PRO" && !onHomePage && (
                <Badge variant="default" className="mb-3 w-fit bg-primary">
                  Current Plan
                </Badge>
              )}
              <CardTitle>Pro</CardTitle>
              <div className="mt-4 space-y-1">
                <span className="block text-3xl sm:text-4xl font-bold">
                  ${isMonthly ? monthlyPrices.PRO : yearlyPrices.PRO}
                </span>
                <span className="text-muted-foreground text-sm">
                  / {isMonthly ? "month" : "year"}
                </span>
              </div>
              <CardDescription className="mt-3">
                For serious entrepreneurs
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0 px-4 sm:px-6">
              <Separator className="border-dashed mb-4" />
              <ul className="list-none space-y-3 sm:space-y-4 text-sm flex-1">
                {features.PRO.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="size-4 shrink-0 mt-0.5 text-primary" />
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            {!onHomePage && (
              <CardFooter className="shrink-0 mt-auto px-4 sm:px-6 pb-4 sm:pb-6">
                {currentPlan === "PRO" ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <PayPalButton
                    tier={isMonthly ? "MONTHLY" : "YEARLY"}
                    planType="BASIC"
                  />
                )}
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:pt-6">
          <div className="flex items-center justify-center gap-4">
            <Label
              htmlFor="billing-toggle"
              className={`text-sm sm:text-base ${!isMonthly ? "text-muted-foreground" : "font-medium"}`}
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
              className={`text-sm sm:text-base ${isMonthly ? "text-muted-foreground" : "font-medium"}`}
            >
              Yearly
            </Label>
            {!isMonthly && (
              <span className="text-sm sm:text-base text-primary font-medium ml-2">
                Save 17%
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            {isMonthly
              ? "Billed monthly. Cancel anytime."
              : "Billed annually. Save 17% compared to monthly billing."}
          </p>
        </div>
      </div>
    </section>
  );
}
