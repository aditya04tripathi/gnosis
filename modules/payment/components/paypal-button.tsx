"use client";

import { PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  captureSubscription,
  getOrCreateSubscriptionPlan,
  type PlanType,
  type SubscriptionTier,
} from "@/modules/payment/actions/payment";

interface PayPalButtonProps {
  tier: SubscriptionTier;
  planType: PlanType;
}

export function PayPalButton({ tier, planType }: PayPalButtonProps) {
  const router = useRouter();

  console.log("[PayPalButton] Component initialized", {
    tier,
    planType,
    timestamp: new Date().toISOString(),
  });

  return (
    <PayPalButtons
      createSubscription={async (_data, actions) => {
        console.log("[PayPalButton] createSubscription called", {
          tier,
          planType,
          data: _data,
          actionsAvailable: !!actions,
          timestamp: new Date().toISOString(),
        });

        try {
          console.log("[PayPalButton] Calling getOrCreateSubscriptionPlan", {
            tier,
            planType,
          });

          const planResult = await getOrCreateSubscriptionPlan(tier, planType);

          console.log("[PayPalButton] getOrCreateSubscriptionPlan result", {
            success: planResult.success,
            planId: planResult.data?.planId,
            error: planResult.error,
            fullResult: planResult,
            timestamp: new Date().toISOString(),
          });

          if (!planResult.success || !planResult.data?.planId) {
            const errorMsg =
              planResult.error || "Failed to get subscription plan";
            console.error("[PayPalButton] Plan creation failed", {
              error: errorMsg,
              result: planResult,
              timestamp: new Date().toISOString(),
            });
            throw new Error(errorMsg);
          }

          const planId = planResult.data.planId;
          console.log("[PayPalButton] Creating subscription with PayPal", {
            planId,
            tier,
            planType,
          });

          const subscriptionPayload = {
            plan_id: planId,
          };

          console.log("[PayPalButton] Subscription payload", {
            payload: subscriptionPayload,
            timestamp: new Date().toISOString(),
          });

          const subscriptionResult =
            await actions.subscription.create(subscriptionPayload);

          console.log("[PayPalButton] PayPal subscription created", {
            subscriptionId: subscriptionResult,
            planId,
            timestamp: new Date().toISOString(),
          });

          return subscriptionResult;
        } catch (error) {
          console.error("[PayPalButton] Create subscription error", {
            error,
            errorMessage:
              error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            tier,
            planType,
            timestamp: new Date().toISOString(),
          });
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to create subscription",
          );
          throw error;
        }
      }}
      onApprove={async (data, _actions) => {
        console.log("[PayPalButton] onApprove called", {
          subscriptionID: data.subscriptionID,
          orderID: data.orderID,
          payerID: data.payerID,
          fullData: data,
          timestamp: new Date().toISOString(),
        });

        try {
          const subscriptionId = data.subscriptionID;

          console.log("[PayPalButton] Processing subscription approval", {
            subscriptionId,
            hasSubscriptionId: !!subscriptionId,
            timestamp: new Date().toISOString(),
          });

          if (!subscriptionId) {
            console.error("[PayPalButton] No subscription ID received", {
              data,
              timestamp: new Date().toISOString(),
            });
            throw new Error("No subscription ID received");
          }

          console.log("[PayPalButton] Calling captureSubscription", {
            subscriptionId,
          });

          const result = await captureSubscription(subscriptionId);

          console.log("[PayPalButton] captureSubscription result", {
            success: result.success,
            error: result.error,
            data: result.data,
            fullResult: result,
            subscriptionId,
            timestamp: new Date().toISOString(),
          });

          if (result.error || !result.success) {
            console.error("[PayPalButton] Subscription capture failed", {
              error: result.error,
              success: result.success,
              subscriptionId,
              timestamp: new Date().toISOString(),
            });
            toast.error(result.error || "Failed to activate subscription");
            return;
          }

          console.log("[PayPalButton] Subscription activated successfully", {
            subscriptionId,
            userData: result.data?.user,
            timestamp: new Date().toISOString(),
          });

          toast.success("Subscription activated successfully!");

          console.log("[PayPalButton] Refreshing router", {
            timestamp: new Date().toISOString(),
          });

          router.refresh();
        } catch (error) {
          console.error("[PayPalButton] Subscription approval error", {
            error,
            errorMessage:
              error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            data,
            timestamp: new Date().toISOString(),
          });
          toast.error("Failed to activate subscription");
        }
      }}
      onError={(err) => {
        console.error("[PayPalButton] PayPal error occurred", {
          error: err,
          errorMessage: err instanceof Error ? err.message : String(err),
          errorStack: err instanceof Error ? err.stack : undefined,
          tier,
          planType,
          timestamp: new Date().toISOString(),
        });
        toast.error("PayPal payment error occurred");
      }}
      onCancel={(data) => {
        console.log("[PayPalButton] PayPal subscription cancelled", {
          data,
          tier,
          planType,
          timestamp: new Date().toISOString(),
        });
      }}
      onClick={(data, actions) => {
        console.log("[PayPalButton] PayPal button clicked", {
          data,
          actionsAvailable: !!actions,
          tier,
          planType,
          timestamp: new Date().toISOString(),
        });
      }}
      style={{
        layout: "vertical",
        color: "blue",
        shape: "rect",
        label: "subscribe",
      }}
    />
  );
}
