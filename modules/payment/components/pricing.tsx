"use client";

import { Check, Info } from "lucide-react";
import Link from "next/link";
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
import { Separator } from "@/modules/shared/components/ui/separator";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/modules/shared/components/ui/alert";

interface PricingProps {
  currentPlan?: string;
  onHomePage?: boolean;
}

export default function Pricing({
  currentPlan = "FREE",
  onHomePage = false,
}: PricingProps) {
  const monthlyPrices = {
    FREE: 0,
    BASIC: 19,
    PRO: 49,
  };

  const features = {
    FREE: [
      "1 AI validation per 2 days",
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
              Choose the perfect plan for your startup validation needs.
            </p>
          </div>
        )}

        <Alert className="mb-6 border-blue-500/50 bg-blue-500/10">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-500">Payment System - Work In Progress</AlertTitle>
          <AlertDescription className="text-blue-500/80">
            Payment integration is currently under development. All users have access to the free plan with 1 AI validation per 2 days. Paid plans will be available soon.
          </AlertDescription>
        </Alert>

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
                  / forever
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
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/auth/signup">Get Started</Link>
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
                  ${monthlyPrices.BASIC}
                </span>
                <span className="text-muted-foreground text-sm">
                  / month
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
                <Button className="w-full" disabled>
                  Payment Coming Soon
                </Button>
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
                  ${monthlyPrices.PRO}
                </span>
                <span className="text-muted-foreground text-sm">
                  / month
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
                <Button className="w-full" disabled>
                  Payment Coming Soon
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

      </div>
    </section>
  );
}
