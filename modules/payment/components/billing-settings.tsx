"use client";

import { Info } from "lucide-react";
import { Badge } from "@/modules/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/modules/shared/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/modules/shared/components/ui/alert";

interface BillingSettingsProps {
  user: {
    subscriptionTier: string;
    paypalSubscriptionId?: string;
  };
}

export function BillingSettings({ user }: BillingSettingsProps) {
  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "FREE":
        return <Badge variant="secondary">Free</Badge>;
      case "MONTHLY":
        return <Badge variant="default">Pro</Badge>;
      case "YEARLY":
        return <Badge variant="default">Pro</Badge>;
      default:
        return <Badge variant="secondary">{plan}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="border-blue-500/50 bg-blue-500/10">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-500">Payment System - Work In Progress</AlertTitle>
        <AlertDescription className="text-blue-500/80">
          Payment integration is currently under development. All users have access to the free plan with 1 AI validation per 2 days. Paid plans will be available soon.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Manage your subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Current Plan</p>
              <p className="text-sm text-muted-foreground">
                {user.subscriptionTier === "FREE" &&
                  "Free plan with 1 AI validation per 2 days"}
                {user.subscriptionTier === "MONTHLY" &&
                  "Pro plan billed monthly"}
                {user.subscriptionTier === "YEARLY" && "Pro plan billed yearly"}
              </p>
            </div>
            {getPlanBadge(user.subscriptionTier)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
