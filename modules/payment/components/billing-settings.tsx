"use client";

import Link from "next/link";
import { Badge } from "@/modules/shared/components/ui/badge";
import { Button } from "@/modules/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/modules/shared/components/ui/card";

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
                  "Free plan with limited features"}
                {user.subscriptionTier === "MONTHLY" &&
                  "Pro plan billed monthly"}
                {user.subscriptionTier === "YEARLY" && "Pro plan billed yearly"}
              </p>
            </div>
            {getPlanBadge(user.subscriptionTier)}
          </div>

          {user.subscriptionTier === "FREE" ? (
            <Button asChild className="w-full">
              <Link href="/pricing">Upgrade to Pro</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full">
              <Link href="/pricing">Change Plan</Link>
            </Button>
          )}
        </CardContent>
      </Card>
      {}
    </div>
  );
}
