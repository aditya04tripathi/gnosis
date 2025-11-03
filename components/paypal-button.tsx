"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  changePlanDirectly,
  createSubscription,
  type PlanType,
  type SubscriptionTier,
} from "@/actions/payment";
import { Button } from "./ui/button";

interface PayPalButtonProps {
  tier: SubscriptionTier;
  planType: PlanType;
  hasPaymentMethod?: boolean;
}

export function PayPalButton({
  tier,
  planType,
  hasPaymentMethod = false,
}: PayPalButtonProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const prices = {
    MONTHLY: { BASIC: 19, PRO: 49 },
    YEARLY: { BASIC: 190, PRO: 490 },
  };

  const price = prices[tier][planType];

  const handleClick = async () => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    try {
      // If user has a saved payment method, change plan directly
      if (hasPaymentMethod) {
        const result = await changePlanDirectly(tier, planType);
        if (result.error || !result.success) {
          toast.error(result.error || "Failed to change plan");
          setIsProcessing(false);
          return;
        }

        if (result.data?.user) {
          toast.success("Plan updated successfully!");
          router.refresh();
        }
        setIsProcessing(false);
      } else {
        // If no payment method, create new subscription via PayPal
        const result = await createSubscription(tier, planType);

        if (result.error || !result.success) {
          toast.error(result.error || "Failed to create subscription");
          setIsProcessing(false);
          return;
        }

        if (result.data?.approvalUrl) {
          // Redirect to PayPal approval URL immediately
          window.location.href = result.data.approvalUrl;
        } else {
          toast.error("No approval URL received from PayPal");
          setIsProcessing(false);
        }
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error(
        hasPaymentMethod
          ? "Failed to change plan"
          : "Failed to create subscription",
      );
      setIsProcessing(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={isProcessing} className="w-full">
      {`Subscribe $${price}/mo`}
    </Button>
  );
}
