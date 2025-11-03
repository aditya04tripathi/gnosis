"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { deleteCache, getCache, setCache } from "@/lib/redis";
import Invoice from "@/models/Invoice";
import User from "@/models/User";

// Types for better type safety with PayPal REST API patterns
export type SubscriptionTier = "MONTHLY" | "YEARLY";
export type PlanType = "BASIC" | "PRO";

export interface PaymentActionResult<T = unknown> {
  success?: boolean;
  error?: string;
  data?: T;
}

export interface SubscriptionPlanResult {
  planId: string;
  tier: SubscriptionTier;
  planType: PlanType;
  amount: number;
}

export interface UserSubscriptionData {
  subscriptionTier: SubscriptionTier | "FREE";
  subscriptionPlan?: PlanType;
  searchesUsed: number;
  searchesResetAt: Date;
}

/**
 * Get PayPal access token using REST API
 */
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const isSandbox = process.env.PAYPAL_MODE === "sandbox";

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const baseUrl = isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Failed to get PayPal access token: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Get base URL for PayPal API
 */
function getPayPalBaseUrl(): string {
  const isSandbox = process.env.PAYPAL_MODE === "sandbox";
  return isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

/**
 * Create a PayPal subscription plan via REST API
 */
async function createPayPalSubscriptionPlan(
  amount: number,
  currency: string = "USD",
  intervalUnit: "MONTH" | "YEAR",
  intervalCount: number = 1
): Promise<{ planId: string }> {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  // First, create a product
  const productResponse = await fetch(`${baseUrl}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name: "Startup Validator Subscription",
      description: "AI-powered startup idea validation service",
      type: "SERVICE",
    }),
  });

  if (!productResponse.ok) {
    const errorData = await productResponse.json().catch(() => ({
      message: "Failed to create product",
    }));
    throw new Error(
      `PayPal product creation failed: ${JSON.stringify(errorData)}`
    );
  }

  const productData = await productResponse.json();
  const productId = productData.id;

  // Create a billing plan
  const planResponse = await fetch(`${baseUrl}/v1/billing/plans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name: `${
        intervalUnit === "MONTH" ? "Monthly" : "Yearly"
      } Subscription Plan`,
      description: `Recurring ${
        intervalUnit === "MONTH" ? "monthly" : "yearly"
      } subscription`,
      billing_cycles: [
        {
          frequency: {
            interval_unit: intervalUnit,
            interval_count: intervalCount,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // 0 means unlimited cycles
          pricing_scheme: {
            fixed_price: {
              value: amount.toFixed(2),
              currency_code: currency,
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
      taxes: {
        percentage: "0",
        inclusive: false,
      },
    }),
  });

  if (!planResponse.ok) {
    const errorData = await planResponse.json().catch(() => ({
      message: "Failed to create plan",
    }));
    throw new Error(
      `PayPal plan creation failed: ${JSON.stringify(errorData)}`
    );
  }

  const planData = await planResponse.json();
  return { planId: planData.id };
}

/**
 * Create a PayPal subscription via REST API
 */
async function createPayPalSubscription(
  planId: string,
  returnUrl: string,
  cancelUrl: string,
  email?: string,
  name?: string
): Promise<{ subscriptionId: string; approvalUrl: string }> {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const subscriptionPayload: {
    plan_id: string;
    subscriber?: {
      name?: { given_name?: string; surname?: string };
      email_address?: string;
    };
    application_context: {
      return_url: string;
      cancel_url: string;
      brand_name: string;
      locale: string;
      shipping_preference: string;
      user_action: string;
    };
  } = {
    plan_id: planId,
    application_context: {
      return_url: returnUrl,
      cancel_url: cancelUrl,
      brand_name: "Startup Validator",
      locale: "en-US",
      shipping_preference: "NO_SHIPPING",
      user_action: "SUBSCRIBE_NOW",
    },
  };

  if (email && name) {
    const nameParts = name.split(" ");
    subscriptionPayload.subscriber = {
      name: {
        given_name: nameParts[0] || name,
        surname: nameParts.slice(1).join(" ") || "",
      },
      email_address: email,
    };
  }

  const response = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(subscriptionPayload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to create subscription",
    }));
    console.error("PayPal subscription creation error:", errorData);
    throw new Error(
      `PayPal subscription creation failed: ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  const subscriptionId = data.id;

  // Find the approval URL
  const approveLink = data.links?.find(
    (link: { rel: string; href: string }) =>
      link.rel === "approve" || link.rel === "edit"
  );

  if (!approveLink) {
    throw new Error("PayPal subscription approval URL not found");
  }

  return {
    subscriptionId,
    approvalUrl: approveLink.href,
  };
}

/**
 * Get PayPal subscription details via REST API
 */
async function getPayPalSubscription(subscriptionId: string) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(
    `${baseUrl}/v1/billing/subscriptions/${subscriptionId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to get subscription",
    }));
    throw new Error(
      `Failed to get PayPal subscription: ${JSON.stringify(errorData)}`
    );
  }

  return response.json();
}

/**
 * Get PayPal plan details via REST API
 */
async function getPayPalPlan(planId: string) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(`${baseUrl}/v1/billing/plans/${planId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to get plan",
    }));
    throw new Error(`Failed to get PayPal plan: ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

/**
 * Suspend PayPal subscription via REST API
 */
async function suspendPayPalSubscription(
  subscriptionId: string
): Promise<{ success: boolean }> {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(
    `${baseUrl}/v1/billing/subscriptions/${subscriptionId}/suspend`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "PayPal-Request-Id": `suspend-${Date.now()}`,
      },
      body: JSON.stringify({
        reason: "User requested cancellation",
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to suspend subscription",
    }));
    throw new Error(
      `PayPal subscription suspension failed: ${JSON.stringify(errorData)}`
    );
  }

  return { success: true };
}

/**
 * Get PayPal subscription update payment method URL via REST API
 */
async function getPayPalSubscriptionUpdatePaymentUrl(
  subscriptionId: string,
  returnUrl: string
): Promise<{ approvalUrl: string }> {
  const isSandbox = process.env.PAYPAL_MODE === "sandbox";

  // Get subscription details first to find the edit link
  const subscription = await getPayPalSubscription(subscriptionId);

  // PayPal provides an "edit" link in the subscription response for updating payment methods
  const editLink = subscription.links?.find(
    (link: { rel: string; href: string }) => link.rel === "edit"
  );

  if (editLink) {
    // Append return URL to the edit link
    const separator = editLink.href.includes("?") ? "&" : "?";
    return {
      approvalUrl: `${editLink.href}${separator}return_url=${encodeURIComponent(
        returnUrl
      )}`,
    };
  }

  // Fallback: Redirect to PayPal subscription management page
  const baseUrl = isSandbox
    ? "https://www.sandbox.paypal.com"
    : "https://www.paypal.com";
  return {
    approvalUrl: `${baseUrl}/myaccount/autopay/connect/${subscriptionId}?returnUrl=${encodeURIComponent(
      returnUrl
    )}`,
  };
}

/**
 * Get subscription transactions (billing history) via REST API
 */
async function _getPayPalSubscriptionTransactions(
  subscriptionId: string,
  startTime?: string,
  endTime?: string
) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  // Build query parameters
  const params = new URLSearchParams();
  if (startTime) params.append("start_time", startTime);
  if (endTime) params.append("end_time", endTime);
  params.append("product_id", "SUBSCRIPTION");

  const response = await fetch(
    `${baseUrl}/v1/billing/subscriptions/${subscriptionId}/transactions?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to get transactions",
    }));

    // If subscription doesn't exist, return empty transactions
    if (errorData.name === "RESOURCE_NOT_FOUND") {
      console.log("Subscription not found, returning empty transactions");
      return { transactions: [] };
    }

    throw new Error(
      `Failed to get PayPal subscription transactions: ${JSON.stringify(
        errorData
      )}`
    );
  }

  return response.json();
}

/**
 * Format PayPal transaction into invoice format
 */
export interface PayPalInvoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "refunded";
  description: string;
  transactionId?: string;
  invoiceUrl?: string;
}

function _formatPayPalTransactionToInvoice(
  transaction: {
    id?: string;
    transaction_id?: string;
    time?: string;
    amount?: {
      value?: string;
      currency_code?: string;
    };
    status?: string;
    description?: string;
  },
  planDescription: string
): PayPalInvoice {
  const amount = parseFloat(transaction.amount?.value || "0");
  const currency = transaction.amount?.currency_code || "USD";
  const transactionId = transaction.transaction_id || transaction.id || "";
  const date = transaction.time || new Date().toISOString();

  // Map PayPal transaction status to invoice status
  let status: "paid" | "pending" | "failed" | "refunded" = "pending";
  const paypalStatus = transaction.status?.toUpperCase();
  if (paypalStatus === "COMPLETED" || paypalStatus === "SUCCESS") {
    status = "paid";
  } else if (paypalStatus === "PENDING") {
    status = "pending";
  } else if (paypalStatus === "FAILED" || paypalStatus === "DENIED") {
    status = "failed";
  } else if (
    paypalStatus === "REFUNDED" ||
    paypalStatus === "PARTIALLY_REFUNDED"
  ) {
    status = "refunded";
  }

  return {
    id: transactionId,
    date,
    amount,
    currency,
    status,
    description: transaction.description || planDescription,
    transactionId,
  };
}

/**
 * Generate a tax invoice for subscription tier changes
 */
async function generateTaxInvoice(
  userId: string,
  subscriptionTier: SubscriptionTier | "FREE",
  subscriptionPlan?: PlanType,
  previousSubscriptionTier?: SubscriptionTier | "FREE",
  previousSubscriptionPlan?: PlanType,
  amount?: number,
  paypalSubscriptionId?: string,
  paypalTransactionId?: string,
  status: "paid" | "pending" | "cancelled" | "refunded" = "paid"
): Promise<void> {
  try {
    await connectDB();

    const { SUBSCRIPTION_PLANS } = await import("@/constants");

    // Calculate amount if not provided
    let invoiceAmount = amount;
    if (invoiceAmount === undefined) {
      if (subscriptionTier === "FREE") {
        invoiceAmount = 0;
      } else if (subscriptionPlan) {
        invoiceAmount =
          subscriptionTier === "MONTHLY"
            ? SUBSCRIPTION_PLANS[subscriptionPlan].monthlyPrice
            : SUBSCRIPTION_PLANS[subscriptionPlan].yearlyPrice;
      } else {
        invoiceAmount = 0;
      }
    }

    // Build description based on change type
    let description = "";
    if (
      previousSubscriptionTier &&
      previousSubscriptionTier !== subscriptionTier
    ) {
      // Plan change (upgrade or downgrade)
      const previousPlanName =
        previousSubscriptionTier === "FREE"
          ? "Free"
          : `${previousSubscriptionPlan || ""} (${previousSubscriptionTier})`;
      const newPlanName =
        subscriptionTier === "FREE"
          ? "Free"
          : `${subscriptionPlan || ""} (${subscriptionTier})`;
      description = `Subscription change from ${previousPlanName} to ${newPlanName}`;
    } else if (subscriptionTier === "FREE") {
      // Downgrade to free
      description = "Subscription cancelled - Downgrade to Free plan";
    } else {
      // New subscription
      const planName = subscriptionPlan
        ? `${subscriptionPlan} Plan (${subscriptionTier})`
        : `${subscriptionTier} Subscription`;
      description = `New subscription: ${planName}`;
    }

    // Generate invoice number before creating invoice
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const count = await Invoice.countDocuments({
      invoiceNumber: { $regex: `^INV-${year}${month}` },
    });
    const sequence = String(count + 1).padStart(4, "0");
    const invoiceNumber = `INV-${year}${month}-${sequence}`;

    // Create invoice
    const invoice = new Invoice({
      userId,
      invoiceNumber,
      amount: invoiceAmount,
      currency: "USD",
      subscriptionTier,
      subscriptionPlan,
      previousSubscriptionTier,
      previousSubscriptionPlan,
      description,
      invoiceDate: new Date(),
      status,
      paypalSubscriptionId,
      paypalTransactionId,
    });

    await invoice.save();
    console.log(`Tax invoice generated: ${invoice.invoiceNumber}`);
  } catch (error) {
    // Log error but don't fail the subscription change
    console.error("Failed to generate tax invoice:", error);
  }
}

/**
 * Gets or creates a PayPal subscription plan for the specified tier and plan type.
 * Uses REST API only.
 */
export async function getOrCreateSubscriptionPlan(
  tier: SubscriptionTier,
  planType: PlanType
): Promise<PaymentActionResult<{ planId: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized", success: false };
  }

  try {
    const { SUBSCRIPTION_PLANS } = await import("@/constants");
    const planConfig = SUBSCRIPTION_PLANS[planType];

    if (!planConfig) {
      return { error: "Invalid plan type", success: false };
    }

    const amount =
      tier === "MONTHLY" ? planConfig.monthlyPrice : planConfig.yearlyPrice;

    // Check cache first to avoid redundant PayPal API calls
    const cacheKey = `paypal_plan:${planType}:${tier}`;
    const cachedPlan = await getCache<{ planId: string }>(cacheKey);

    if (cachedPlan?.planId) {
      // Cache plan details for reverse lookup
      await setCache(
        `paypal_plan_details:${cachedPlan.planId}`,
        { tier, planType, amount },
        24 * 60 * 60
      );
      return {
        success: true,
        data: { planId: cachedPlan.planId },
      };
    }

    // Create a subscription plan via PayPal REST API
    const { planId } = await createPayPalSubscriptionPlan(
      amount,
      "USD",
      tier === "MONTHLY" ? "MONTH" : "YEAR",
      1
    );

    // Cache the plan ID (24 hour TTL)
    await setCache(cacheKey, { planId }, 24 * 60 * 60);
    // Cache plan details for reverse lookup
    await setCache(
      `paypal_plan_details:${planId}`,
      { tier, planType, amount },
      24 * 60 * 60
    );

    return {
      success: true,
      data: { planId },
    };
  } catch (error) {
    console.error("Get or create subscription plan error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to get subscription plan",
      success: false,
    };
  }
}

/**
 * Creates a PayPal subscription and returns approval URL for redirect.
 * Uses REST API only.
 */
export async function createSubscription(
  tier: SubscriptionTier,
  planType: PlanType
): Promise<
  PaymentActionResult<{ approvalUrl: string; subscriptionId: string }>
> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized", success: false };
  }

  try {
    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return { error: "User not found", success: false };
    }

    // Get or create subscription plan
    const planResult = await getOrCreateSubscriptionPlan(tier, planType);
    if (!planResult.success || !planResult.data?.planId) {
      return {
        error: planResult.error || "Failed to get subscription plan",
        success: false,
      };
    }

    // Build return URLs - PayPal will automatically append subscription_id parameter
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnUrl = `${baseUrl}/billing/payment/return`;
    const cancelUrl = `${baseUrl}/billing/payment/cancel`;

    // Create subscription via REST API
    const { subscriptionId, approvalUrl } = await createPayPalSubscription(
      planResult.data.planId,
      returnUrl,
      cancelUrl,
      user.email || undefined,
      user.name || undefined
    );

    // Get amount for caching
    const { SUBSCRIPTION_PLANS } = await import("@/constants");
    const amount =
      tier === "MONTHLY"
        ? SUBSCRIPTION_PLANS[planType].monthlyPrice
        : SUBSCRIPTION_PLANS[planType].yearlyPrice;

    // Cache subscription details for capture
    await setCache(
      `paypal_subscription:${subscriptionId}`,
      {
        userId: session.user.id,
        tier,
        planType,
        amount,
        planId: planResult.data.planId,
      },
      24 * 60 * 60 // 24 hours
    );

    return {
      success: true,
      data: { approvalUrl, subscriptionId },
    };
  } catch (error) {
    console.error("Create subscription error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create subscription",
      success: false,
    };
  }
}

/**
 * Changes user's subscription plan directly (for existing subscribers).
 * Uses REST API only. Note: PayPal subscriptions cannot be directly updated,
 * so this cancels the old subscription and creates a new one.
 */
export async function changePlanDirectly(
  tier: SubscriptionTier,
  planType: PlanType
): Promise<PaymentActionResult<{ user: UserSubscriptionData }>> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized", success: false };
  }

  try {
    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return { error: "User not found", success: false };
    }

    // Check if user has an active PayPal subscription
    if (!user.paypalSubscriptionId) {
      return {
        error:
          "No active subscription found. Please complete PayPal subscription first.",
        success: false,
      };
    }

    // For PayPal, we need to cancel the old subscription and create a new one
    // Since PayPal doesn't support direct plan updates via PATCH
    // First try to suspend the old subscription (if it exists)
    try {
      await suspendPayPalSubscription(user.paypalSubscriptionId);
    } catch (error) {
      // If subscription doesn't exist or is already cancelled, that's fine
      // We can still create a new subscription
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes("RESOURCE_NOT_FOUND")) {
        console.error("Failed to suspend old subscription:", error);
      }
      // Continue anyway - subscription may already be cancelled or not exist
    }

    // Get or create the new subscription plan
    const planResult = await getOrCreateSubscriptionPlan(tier, planType);
    if (!planResult.success || !planResult.data?.planId) {
      return {
        error: planResult.error || "Failed to get subscription plan",
        success: false,
      };
    }

    // Get amount for caching
    const { SUBSCRIPTION_PLANS } = await import("@/constants");
    const amount =
      tier === "MONTHLY"
        ? SUBSCRIPTION_PLANS[planType].monthlyPrice
        : SUBSCRIPTION_PLANS[planType].yearlyPrice;

    // Create new subscription
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnUrl = `${baseUrl}/billing/payment/return`;
    const cancelUrl = `${baseUrl}/billing/payment/cancel`;

    const { subscriptionId } = await createPayPalSubscription(
      planResult.data.planId,
      returnUrl,
      cancelUrl,
      user.email || undefined,
      user.name || undefined
    );

    // Cache subscription details
    await setCache(
      `paypal_subscription:${subscriptionId}`,
      {
        userId: session.user.id,
        tier,
        planType,
        amount,
        planId: planResult.data.planId,
      },
      24 * 60 * 60
    );

    // Store previous subscription info for invoice
    const previousSubscriptionTier = user.subscriptionTier;
    const previousSubscriptionPlan = user.subscriptionPlan;

    // Update user with new subscription ID
    const daysUntilReset = tier === "YEARLY" ? 365 : 30;
    user.subscriptionTier = tier;
    user.subscriptionPlan = planType;
    user.paypalSubscriptionId = subscriptionId;
    user.searchesResetAt = new Date(
      Date.now() + daysUntilReset * 24 * 60 * 60 * 1000
    );
    user.searchesUsed = 0;
    await user.save();

    // Generate tax invoice for subscription change
    await generateTaxInvoice(
      session.user.id,
      tier,
      planType,
      previousSubscriptionTier as SubscriptionTier | "FREE",
      previousSubscriptionPlan,
      undefined, // amount will be calculated
      subscriptionId
    );

    // Revalidate all relevant paths
    revalidatePath("/");
    revalidatePath("/pricing");
    revalidatePath("/dashboard");
    revalidatePath("/billing");
    revalidatePath("/invoices");
    revalidatePath("/profile");
    revalidatePath("/usage");
    revalidatePath("/validate");

    return {
      success: true,
      data: {
        user: {
          subscriptionTier: user.subscriptionTier,
          subscriptionPlan: user.subscriptionPlan,
          searchesUsed: user.searchesUsed,
          searchesResetAt: user.searchesResetAt,
        },
      },
    };
  } catch (error) {
    console.error("Direct plan change error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to change plan",
      success: false,
    };
  }
}

/**
 * Captures and activates a PayPal subscription after user approval.
 * Called from PayPal return URL route handler.
 */
export async function captureSubscription(
  subscriptionId: string,
  tier?: SubscriptionTier,
  planType?: PlanType
): Promise<
  PaymentActionResult<{
    subscriptionId: string;
    user: UserSubscriptionData;
  }>
> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized", success: false };
  }

  try {
    await connectDB();

    // Get subscription details from cache (stored when subscription was created)
    const subscriptionDetails = await getCache<{
      userId: string;
      tier: SubscriptionTier;
      planType: PlanType;
      amount: number;
      planId: string;
    }>(`paypal_subscription:${subscriptionId}`);

    // Verify subscription status with PayPal first
    const subscription = await getPayPalSubscription(subscriptionId);

    // Extract tier and planType from subscription or cache
    let finalTier: SubscriptionTier | undefined =
      subscriptionDetails?.tier || tier;
    let finalPlanType: PlanType | undefined =
      subscriptionDetails?.planType || planType;

    // If cache is missing, try to get details from PayPal plan
    if (!finalTier || !finalPlanType) {
      const planId = subscription.plan_id;
      if (planId) {
        // Try to get plan details from cache first
        const planDetails = await getCache<{
          tier: SubscriptionTier;
          planType: PlanType;
          amount: number;
        }>(`paypal_plan_details:${planId}`);

        if (planDetails) {
          finalTier = planDetails.tier;
          finalPlanType = planDetails.planType;
        } else {
          // If cache miss, fetch plan details from PayPal API
          try {
            const plan = await getPayPalPlan(planId);
            const billingCycle = plan.billing_cycles?.[0];
            const frequency = billingCycle?.frequency;
            const pricingScheme = billingCycle?.pricing_scheme;
            const amount = parseFloat(pricingScheme?.fixed_price?.value || "0");

            // Extract tier from billing cycle frequency
            if (frequency?.interval_unit === "MONTH") {
              finalTier = "MONTHLY";
            } else if (frequency?.interval_unit === "YEAR") {
              finalTier = "YEARLY";
            }

            // Determine planType from amount
            // BASIC: $19/month or $190/year
            // PRO: $49/month or $490/year
            if (!finalPlanType && amount > 0) {
              const { SUBSCRIPTION_PLANS } = await import("@/constants");
              if (finalTier === "MONTHLY") {
                if (amount === SUBSCRIPTION_PLANS.PRO.monthlyPrice) {
                  finalPlanType = "PRO";
                } else if (amount === SUBSCRIPTION_PLANS.BASIC.monthlyPrice) {
                  finalPlanType = "BASIC";
                }
              } else if (finalTier === "YEARLY") {
                if (amount === SUBSCRIPTION_PLANS.PRO.yearlyPrice) {
                  finalPlanType = "PRO";
                } else if (amount === SUBSCRIPTION_PLANS.BASIC.yearlyPrice) {
                  finalPlanType = "BASIC";
                }
              }

              // If still not determined, log warning but default to BASIC as fallback
              if (!finalPlanType) {
                console.warn(
                  `Could not determine plan type from amount: ${amount}, tier: ${finalTier}`
                );
                finalPlanType = "BASIC";
              } else {
                // Successfully determined planType from amount - cache it for future lookups
                await setCache(
                  `paypal_plan_details:${planId}`,
                  { tier: finalTier, planType: finalPlanType, amount },
                  24 * 60 * 60
                );
              }
            } else if (!finalPlanType) {
              // No amount found, default to BASIC
              console.warn(
                "Could not determine plan type: no amount found in plan"
              );
              finalPlanType = "BASIC";
            }
          } catch (error) {
            console.error("Failed to fetch plan details from PayPal:", error);
            // Use defaults as fallback
            finalTier = finalTier || "MONTHLY";
            finalPlanType = finalPlanType || "BASIC";
          }
        }
      } else {
        // No plan ID, use defaults
        finalTier = finalTier || "MONTHLY";
        finalPlanType = finalPlanType || "BASIC";
      }
    }

    // Verify the subscription belongs to the current user if cached
    if (
      subscriptionDetails?.userId &&
      subscriptionDetails.userId !== session.user.id
    ) {
      return {
        error: "Subscription does not belong to current user",
        success: false,
      };
    }

    const validStatuses = ["ACTIVE", "APPROVAL_PENDING"];
    if (!validStatuses.includes(subscription.status)) {
      return {
        error: `Subscription is not active. Status: ${subscription.status}`,
        success: false,
      };
    }

    // Ensure we have required values
    if (!finalTier || !finalPlanType) {
      return {
        error: "Could not determine subscription tier or plan type",
        success: false,
      };
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return { error: "User not found", success: false };
    }

    // Store previous subscription info for invoice
    const previousSubscriptionTier = user.subscriptionTier;
    const previousSubscriptionPlan = user.subscriptionPlan;

    // Calculate reset date based on tier
    const daysUntilReset = finalTier === "YEARLY" ? 365 : 30;

    // Update user subscription
    user.subscriptionTier = finalTier;
    user.subscriptionPlan = finalPlanType;
    user.paypalSubscriptionId = subscriptionId;
    user.searchesResetAt = new Date(
      Date.now() + daysUntilReset * 24 * 60 * 60 * 1000
    );
    user.searchesUsed = 0;
    await user.save();

    // Generate tax invoice for new subscription
    await generateTaxInvoice(
      session.user.id,
      finalTier,
      finalPlanType,
      previousSubscriptionTier as SubscriptionTier | "FREE",
      previousSubscriptionPlan,
      undefined, // amount will be calculated
      subscriptionId
    );

    // Clean up Redis cache
    await deleteCache(`paypal_subscription:${subscriptionId}`);

    // Revalidate all relevant paths
    revalidatePath("/");
    revalidatePath("/pricing");
    revalidatePath("/dashboard");
    revalidatePath("/billing");
    revalidatePath("/invoices");
    revalidatePath("/profile");
    revalidatePath("/usage");
    revalidatePath("/validate");

    return {
      success: true,
      data: {
        subscriptionId,
        user: {
          subscriptionTier: user.subscriptionTier,
          subscriptionPlan: user.subscriptionPlan,
          searchesUsed: user.searchesUsed,
          searchesResetAt: user.searchesResetAt,
        },
      },
    };
  } catch (error) {
    console.error("Subscription activation error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to activate subscription",
      success: false,
    };
  }
}

/**
 * Downgrades user subscription to FREE plan and suspends PayPal subscription.
 * Uses REST API only.
 */
export async function downgradeToFree(): Promise<
  PaymentActionResult<{ user: UserSubscriptionData }>
> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized", success: false };
  }

  try {
    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return { error: "User not found", success: false };
    }

    // If user has an active PayPal subscription, suspend it
    if (user.paypalSubscriptionId) {
      try {
        await suspendPayPalSubscription(user.paypalSubscriptionId);
      } catch (error) {
        console.error("Failed to suspend PayPal subscription:", error);
        // Continue with downgrade even if suspend fails
      }
    }

    // Store previous subscription info for invoice
    const previousSubscriptionTier = user.subscriptionTier;
    const previousSubscriptionPlan = user.subscriptionPlan;

    // Update user to FREE plan
    user.subscriptionTier = "FREE";
    user.subscriptionPlan = undefined;
    user.paypalSubscriptionId = undefined;
    user.searchesResetAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days from now
    );
    // Don't reset searchesUsed - let them keep what they've used
    await user.save();

    // Generate tax invoice for cancellation/downgrade (amount is 0)
    await generateTaxInvoice(
      session.user.id,
      "FREE",
      undefined,
      previousSubscriptionTier as SubscriptionTier | "FREE",
      previousSubscriptionPlan,
      0, // No charge for downgrade
      undefined, // No PayPal subscription ID for free plan
      undefined,
      "cancelled"
    );

    // Revalidate all relevant paths
    revalidatePath("/");
    revalidatePath("/pricing");
    revalidatePath("/dashboard");
    revalidatePath("/billing");
    revalidatePath("/invoices");
    revalidatePath("/profile");
    revalidatePath("/usage");
    revalidatePath("/validate");

    return {
      success: true,
      data: {
        user: {
          subscriptionTier: user.subscriptionTier,
          subscriptionPlan: user.subscriptionPlan,
          searchesUsed: user.searchesUsed,
          searchesResetAt: user.searchesResetAt,
        },
      },
    };
  } catch (error) {
    console.error("Downgrade to free error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to downgrade to free plan",
      success: false,
    };
  }
}

/**
 * Alias for captureSubscription - captures and activates a PayPal subscription.
 * Used by PayPal return URL route handler.
 */
export async function capturePayment(subscriptionId: string): Promise<
  PaymentActionResult<{
    subscriptionId: string;
    user: UserSubscriptionData;
  }>
> {
  // Delegate to captureSubscription without tier/planType (will use cached values)
  return captureSubscription(subscriptionId);
}

/**
 * Gets invoices for the current user from the database
 * Returns both database invoices and PayPal transactions
 */
export async function getInvoices(): Promise<
  PaymentActionResult<{
    invoices: Array<{
      id: string;
      invoiceNumber?: string;
      date: string;
      amount: number;
      status: "paid" | "pending" | "failed" | "cancelled" | "refunded";
      description: string;
      invoiceUrl?: string;
    }>;
  }>
> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized", success: false };
  }

  try {
    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return { error: "User not found", success: false };
    }

    // Fetch invoices from database
    const dbInvoices = await Invoice.find({ userId: session.user.id })
      .sort({ invoiceDate: -1 })
      .lean();

    const invoices = dbInvoices.map((invoice) => ({
      id: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.invoiceDate.toISOString(),
      amount: invoice.amount,
      status: invoice.status as
        | "paid"
        | "pending"
        | "failed"
        | "cancelled"
        | "refunded",
      description: invoice.description,
    }));

    return {
      success: true,
      data: { invoices },
    };
  } catch (error) {
    console.error("Get invoices error:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to fetch invoices",
      success: false,
    };
  }
}
