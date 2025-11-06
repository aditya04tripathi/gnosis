"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/shared/lib/auth";
import connectDB from "@/modules/shared/lib/db";
import { deleteCache, getCache, setCache } from "@/modules/shared/lib/redis";
import Invoice from "@/modules/shared/models/Invoice";
import User from "@/modules/shared/models/User";

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

async function getPayPalAccessToken(): Promise<string> {
  console.log("[getPayPalAccessToken] Starting token request", {
    timestamp: new Date().toISOString(),
  });

  const isSandbox = process.env.NEXT_PUBLIC_PAYPAL_MODE === "sandbox";
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_SECRET;

  console.log("[getPayPalAccessToken] Environment check", {
    hasClientId: !!clientId,
    clientIdLength: clientId?.length,
    clientIdPrefix: clientId ? `${clientId.substring(0, 10)}...` : "N/A",
    hasClientSecret: !!clientSecret,
    clientSecretLength: clientSecret?.length,
    isSandbox,
    paypalMode: process.env.NEXT_PUBLIC_PAYPAL_MODE,
    timestamp: new Date().toISOString(),
  });

  if (!clientId || !clientSecret) {
    console.error("[getPayPalAccessToken] Missing credentials", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      timestamp: new Date().toISOString(),
    });
    throw new Error("PayPal credentials not configured");
  }

  const baseUrl = isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  console.log("[getPayPalAccessToken] Making request", {
    baseUrl,
    endpoint: `${baseUrl}/v1/oauth2/token`,
    isSandbox,
    timestamp: new Date().toISOString(),
  });

  const authHeader = `Basic ${Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64")}`;

  console.log("[getPayPalAccessToken] Request details", {
    method: "POST",
    url: `${baseUrl}/v1/oauth2/token`,
    hasAuthHeader: !!authHeader,
    authHeaderLength: authHeader.length,
    authHeaderPrefix: authHeader.substring(0, 20),
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Language": "en_US",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authHeader,
      },
      body: "grant_type=client_credentials",
    });

    console.log("[getPayPalAccessToken] Response received", {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      timestamp: new Date().toISOString(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("[getPayPalAccessToken] Request failed", {
        status: response.status,
        statusText: response.statusText,
        errorText,
        errorTextParsed: (() => {
          try {
            return JSON.parse(errorText);
          } catch {
            return errorText;
          }
        })(),
        baseUrl,
        isSandbox,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to get PayPal access token: ${errorText}`);
    }

    const data = await response.json();
    console.log("[getPayPalAccessToken] Token received", {
      hasAccessToken: !!data.access_token,
      accessTokenLength: data.access_token?.length,
      accessTokenPrefix: data.access_token
        ? `${data.access_token.substring(0, 20)}...`
        : "N/A",
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      fullResponse: data,
      timestamp: new Date().toISOString(),
    });

    if (!data.access_token) {
      console.error("[getPayPalAccessToken] No access token in response", {
        data,
        timestamp: new Date().toISOString(),
      });
      throw new Error("No access token in PayPal response");
    }

    return data.access_token;
  } catch (error) {
    console.error("[getPayPalAccessToken] Exception occurred", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      baseUrl,
      isSandbox,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

function getPayPalBaseUrl(): string {
  const isSandbox = process.env.NEXT_PUBLIC_PAYPAL_MODE === "sandbox";
  return isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

async function createPayPalSubscriptionPlan(
  amount: number,
  currency: string = "USD",
  intervalUnit: "MONTH" | "YEAR",
  intervalCount: number = 1
): Promise<{ planId: string }> {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const productResponse = await fetch(`${baseUrl}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name: "Gnosis Subscription",
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
          total_cycles: 0,
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
      brand_name: "Gnosis",
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

async function getPayPalSubscriptionUpdatePaymentUrl(
  subscriptionId: string,
  returnUrl: string
): Promise<{ approvalUrl: string }> {
  const isSandbox = process.env.NEXT_PUBLIC_PAYPAL_MODE === "sandbox";

  const subscription = await getPayPalSubscription(subscriptionId);

  const editLink = subscription.links?.find(
    (link: { rel: string; href: string }) => link.rel === "edit"
  );

  if (editLink) {
    const separator = editLink.href.includes("?") ? "&" : "?";
    return {
      approvalUrl: `${editLink.href}${separator}return_url=${encodeURIComponent(
        returnUrl
      )}`,
    };
  }

  const baseUrl = isSandbox
    ? "https://www.sandbox.paypal.com"
    : "https://www.paypal.com";
  return {
    approvalUrl: `${baseUrl}/myaccount/autopay/connect/${subscriptionId}?returnUrl=${encodeURIComponent(
      returnUrl
    )}`,
  };
}

async function _getPayPalSubscriptionTransactions(
  subscriptionId: string,
  startTime?: string,
  endTime?: string
) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

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

    const { SUBSCRIPTION_PLANS } = await import("@/modules/shared/constants");

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

    let description = "";
    if (
      previousSubscriptionTier &&
      previousSubscriptionTier !== subscriptionTier
    ) {
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
      description = "Subscription cancelled - Downgrade to Free plan";
    } else {
      const planName = subscriptionPlan
        ? `${subscriptionPlan} Plan (${subscriptionTier})`
        : `${subscriptionTier} Subscription`;
      description = `New subscription: ${planName}`;
    }

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const count = await Invoice.countDocuments({
      invoiceNumber: { $regex: `^INV-${year}${month}` },
    });
    const sequence = String(count + 1).padStart(4, "0");
    const invoiceNumber = `INV-${year}${month}-${sequence}`;

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
    console.error("Failed to generate tax invoice:", error);
  }
}

export async function getOrCreateSubscriptionPlan(
  tier: SubscriptionTier,
  planType: PlanType
): Promise<PaymentActionResult<{ planId: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized", success: false };
  }

  try {
    const { SUBSCRIPTION_PLANS } = await import("@/modules/shared/constants");
    const planConfig = SUBSCRIPTION_PLANS[planType];

    if (!planConfig) {
      return { error: "Invalid plan type", success: false };
    }

    const amount =
      tier === "MONTHLY" ? planConfig.monthlyPrice : planConfig.yearlyPrice;

    const cacheKey = `paypal_plan:${planType}:${tier}`;
    const cachedPlan = await getCache<{ planId: string }>(cacheKey);

    if (cachedPlan?.planId) {
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

    const { planId } = await createPayPalSubscriptionPlan(
      amount,
      "USD",
      tier === "MONTHLY" ? "MONTH" : "YEAR",
      1
    );

    await setCache(cacheKey, { planId }, 24 * 60 * 60);

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

    const planResult = await getOrCreateSubscriptionPlan(tier, planType);
    if (!planResult.success || !planResult.data?.planId) {
      return {
        error: planResult.error || "Failed to get subscription plan",
        success: false,
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnUrl = `${baseUrl}/billing/payment/return`;
    const cancelUrl = `${baseUrl}/billing/payment/cancel`;

    const { subscriptionId, approvalUrl } = await createPayPalSubscription(
      planResult.data.planId,
      returnUrl,
      cancelUrl,
      user.email || undefined,
      user.name || undefined
    );

    const { SUBSCRIPTION_PLANS } = await import("@/modules/shared/constants");
    const amount =
      tier === "MONTHLY"
        ? SUBSCRIPTION_PLANS[planType].monthlyPrice
        : SUBSCRIPTION_PLANS[planType].yearlyPrice;

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

    if (!user.paypalSubscriptionId) {
      return {
        error:
          "No active subscription found. Please complete PayPal subscription first.",
        success: false,
      };
    }

    try {
      await suspendPayPalSubscription(user.paypalSubscriptionId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes("RESOURCE_NOT_FOUND")) {
        console.error("Failed to suspend old subscription:", error);
      }
    }

    const planResult = await getOrCreateSubscriptionPlan(tier, planType);
    if (!planResult.success || !planResult.data?.planId) {
      return {
        error: planResult.error || "Failed to get subscription plan",
        success: false,
      };
    }

    const { SUBSCRIPTION_PLANS } = await import("@/modules/shared/constants");
    const amount =
      tier === "MONTHLY"
        ? SUBSCRIPTION_PLANS[planType].monthlyPrice
        : SUBSCRIPTION_PLANS[planType].yearlyPrice;

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

    const previousSubscriptionTier = user.subscriptionTier;
    const previousSubscriptionPlan = user.subscriptionPlan;

    const daysUntilReset = tier === "YEARLY" ? 365 : 30;
    user.subscriptionTier = tier;
    user.subscriptionPlan = planType;
    user.paypalSubscriptionId = subscriptionId;
    user.searchesResetAt = new Date(
      Date.now() + daysUntilReset * 24 * 60 * 60 * 1000
    );
    user.searchesUsed = 0;
    await user.save();

    await generateTaxInvoice(
      session.user.id,
      tier,
      planType,
      previousSubscriptionTier as SubscriptionTier | "FREE",
      previousSubscriptionPlan,
      undefined,
      subscriptionId
    );

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

    const subscriptionDetails = await getCache<{
      userId: string;
      tier: SubscriptionTier;
      planType: PlanType;
      amount: number;
      planId: string;
    }>(`paypal_subscription:${subscriptionId}`);

    const subscription = await getPayPalSubscription(subscriptionId);

    let finalTier: SubscriptionTier | undefined =
      subscriptionDetails?.tier || tier;
    let finalPlanType: PlanType | undefined =
      subscriptionDetails?.planType || planType;

    if (!finalTier || !finalPlanType) {
      const planId = subscription.plan_id;
      if (planId) {
        const planDetails = await getCache<{
          tier: SubscriptionTier;
          planType: PlanType;
          amount: number;
        }>(`paypal_plan_details:${planId}`);

        if (planDetails) {
          finalTier = planDetails.tier;
          finalPlanType = planDetails.planType;
        } else {
          try {
            const plan = await getPayPalPlan(planId);
            const billingCycle = plan.billing_cycles?.[0];
            const frequency = billingCycle?.frequency;
            const pricingScheme = billingCycle?.pricing_scheme;
            const amount = parseFloat(pricingScheme?.fixed_price?.value || "0");

            if (frequency?.interval_unit === "MONTH") {
              finalTier = "MONTHLY";
            } else if (frequency?.interval_unit === "YEAR") {
              finalTier = "YEARLY";
            }

            if (!finalPlanType && amount > 0) {
              const { SUBSCRIPTION_PLANS } = await import(
                "@/modules/shared/constants"
              );
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

              if (!finalPlanType) {
                console.warn(
                  `Could not determine plan type from amount: ${amount}, tier: ${finalTier}`
                );
                finalPlanType = "BASIC";
              } else {
                await setCache(
                  `paypal_plan_details:${planId}`,
                  { tier: finalTier, planType: finalPlanType, amount },
                  24 * 60 * 60
                );
              }
            } else if (!finalPlanType) {
              console.warn(
                "Could not determine plan type: no amount found in plan"
              );
              finalPlanType = "BASIC";
            }
          } catch (error) {
            console.error("Failed to fetch plan details from PayPal:", error);

            finalTier = finalTier || "MONTHLY";
            finalPlanType = finalPlanType || "BASIC";
          }
        }
      } else {
        finalTier = finalTier || "MONTHLY";
        finalPlanType = finalPlanType || "BASIC";
      }
    }

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

    const previousSubscriptionTier = user.subscriptionTier;
    const previousSubscriptionPlan = user.subscriptionPlan;

    const daysUntilReset = finalTier === "YEARLY" ? 365 : 30;

    user.subscriptionTier = finalTier;
    user.subscriptionPlan = finalPlanType;
    user.paypalSubscriptionId = subscriptionId;
    user.searchesResetAt = new Date(
      Date.now() + daysUntilReset * 24 * 60 * 60 * 1000
    );
    user.searchesUsed = 0;
    await user.save();

    await generateTaxInvoice(
      session.user.id,
      finalTier,
      finalPlanType,
      previousSubscriptionTier as SubscriptionTier | "FREE",
      previousSubscriptionPlan,
      undefined,
      subscriptionId
    );

    await deleteCache(`paypal_subscription:${subscriptionId}`);

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

    if (user.paypalSubscriptionId) {
      try {
        await suspendPayPalSubscription(user.paypalSubscriptionId);
      } catch (error) {
        console.error("Failed to suspend PayPal subscription:", error);
      }
    }

    const previousSubscriptionTier = user.subscriptionTier;
    const previousSubscriptionPlan = user.subscriptionPlan;

    user.subscriptionTier = "FREE";
    user.subscriptionPlan = undefined;
    user.paypalSubscriptionId = undefined;
    user.searchesResetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await user.save();

    await generateTaxInvoice(
      session.user.id,
      "FREE",
      undefined,
      previousSubscriptionTier as SubscriptionTier | "FREE",
      previousSubscriptionPlan,
      0,
      undefined,
      undefined,
      "cancelled"
    );

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

export async function capturePayment(subscriptionId: string): Promise<
  PaymentActionResult<{
    subscriptionId: string;
    user: UserSubscriptionData;
  }>
> {
  return captureSubscription(subscriptionId);
}

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
