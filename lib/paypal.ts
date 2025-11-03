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
        `${clientId}:${clientSecret}`,
      ).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get PayPal access token");
  }

  const data = await response.json();
  return data.access_token;
}

export async function createPayPalOrder(
  amount: number,
  currency: string = "USD",
  returnUrl: string,
  cancelUrl: string,
): Promise<{ orderId: string; approvalUrl: string }> {
  const accessToken = await getPayPalAccessToken();
  const isSandbox = process.env.PAYPAL_MODE === "sandbox";
  const baseUrl = isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  // Step 1: Create order without payment_source (multi-step flow)
  const createOrderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
        },
      ],
    }),
  });

  if (!createOrderResponse.ok) {
    let errorData: unknown;
    try {
      errorData = await createOrderResponse.json();
    } catch {
      const errorText = await createOrderResponse.text();
      errorData = { message: errorText };
    }
    console.error("PayPal create order error:", errorData);
    throw new Error(
      `PayPal order creation failed: ${JSON.stringify(errorData)}`,
    );
  }

  const orderData = await createOrderResponse.json();
  const orderId = orderData.id;

  // Step 2: Confirm payment source to get approval URL
  const confirmResponse = await fetch(
    `${baseUrl}/v2/checkout/orders/${orderId}/confirm-payment-source`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
              brand_name: "Startup Validator",
              locale: "en-US",
              landing_page: "LOGIN",
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
              return_url: returnUrl,
              cancel_url: cancelUrl,
            },
          },
        },
      }),
    },
  );

  if (!confirmResponse.ok) {
    let errorData: unknown;
    try {
      errorData = await confirmResponse.json();
    } catch {
      const errorText = await confirmResponse.text();
      errorData = { message: errorText };
    }
    console.error("PayPal confirm payment source error:", errorData);
    throw new Error(
      `PayPal payment source confirmation failed: ${JSON.stringify(errorData)}`,
    );
  }

  const confirmData = await confirmResponse.json();

  // Find the approval URL in the links array
  const approveLink = confirmData.links?.find(
    (link: { rel: string; href: string }) =>
      link.rel === "payer-action" || link.rel === "approve",
  );

  if (!approveLink) {
    // Try getting from the order details if not in links
    const orderDetails = await getPayPalOrder(orderId);
    const orderApproveLink = orderDetails.links?.find(
      (link: { rel: string; href: string }) =>
        link.rel === "payer-action" || link.rel === "approve",
    );
    if (orderApproveLink) {
      return {
        orderId,
        approvalUrl: orderApproveLink.href,
      };
    }
    throw new Error("PayPal approval URL not found");
  }

  return {
    orderId,
    approvalUrl: approveLink.href,
  };
}

export async function capturePayPalOrder(
  orderId: string,
): Promise<{ success: boolean; transactionId?: string }> {
  const accessToken = await getPayPalAccessToken();
  const isSandbox = process.env.PAYPAL_MODE === "sandbox";
  const baseUrl = isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  const response = await fetch(
    `${baseUrl}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
    },
  );

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      const errorText = await response.text();
      errorData = { message: errorText };
    }
    console.error("PayPal capture error:", errorData);
    throw new Error(`PayPal capture failed: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

  return {
    success: data.status === "COMPLETED",
    transactionId: capture?.id,
  };
}

export async function getPayPalOrder(orderId: string) {
  const accessToken = await getPayPalAccessToken();
  const isSandbox = process.env.PAYPAL_MODE === "sandbox";
  const baseUrl = isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get PayPal order");
  }

  return response.json();
}

// PayPal Subscriptions API functions
export async function createPayPalSubscriptionPlan(
  amount: number,
  currency: string = "USD",
  intervalUnit: "MONTH" | "YEAR",
  intervalCount: number = 1,
): Promise<{ planId: string }> {
  const accessToken = await getPayPalAccessToken();
  const isSandbox = process.env.PAYPAL_MODE === "sandbox";
  const baseUrl = isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

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
      `PayPal product creation failed: ${JSON.stringify(errorData)}`,
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
      `PayPal plan creation failed: ${JSON.stringify(errorData)}`,
    );
  }

  const planData = await planResponse.json();

  return {
    planId: planData.id,
  };
}

export async function createPayPalSubscription(
  planId: string,
  returnUrl: string,
  cancelUrl: string,
  email?: string,
  name?: string,
): Promise<{ subscriptionId: string; approvalUrl: string }> {
  const accessToken = await getPayPalAccessToken();
  const isSandbox = process.env.PAYPAL_MODE === "sandbox";
  const baseUrl = isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

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
      `PayPal subscription creation failed: ${JSON.stringify(errorData)}`,
    );
  }

  const data = await response.json();
  const subscriptionId = data.id;

  // Find the approval URL
  const approveLink = data.links?.find(
    (link: { rel: string; href: string }) =>
      link.rel === "approve" || link.rel === "edit",
  );

  if (!approveLink) {
    throw new Error("PayPal subscription approval URL not found");
  }

  return {
    subscriptionId,
    approvalUrl: approveLink.href,
  };
}

export async function getPayPalSubscription(subscriptionId: string) {
  const accessToken = await getPayPalAccessToken();
  const isSandbox = process.env.PAYPAL_MODE === "sandbox";
  const baseUrl = isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  const response = await fetch(
    `${baseUrl}/v1/billing/subscriptions/${subscriptionId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to get subscription",
    }));
    throw new Error(
      `Failed to get PayPal subscription: ${JSON.stringify(errorData)}`,
    );
  }

  return response.json();
}

export async function updatePayPalSubscription(
  subscriptionId: string,
  newPlanId: string,
): Promise<{ success: boolean }> {
  const accessToken = await getPayPalAccessToken();
  const isSandbox = process.env.PAYPAL_MODE === "sandbox";
  const baseUrl = isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  const response = await fetch(
    `${baseUrl}/v1/billing/subscriptions/${subscriptionId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify([
        {
          op: "replace",
          path: "/plan",
          value: {
            id: newPlanId,
          },
        },
      ]),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to update subscription",
    }));
    console.error("PayPal subscription update error:", errorData);
    throw new Error(
      `PayPal subscription update failed: ${JSON.stringify(errorData)}`,
    );
  }

  return { success: true };
}

export async function suspendPayPalSubscription(
  subscriptionId: string,
): Promise<{ success: boolean }> {
  const accessToken = await getPayPalAccessToken();
  const isSandbox = process.env.PAYPAL_MODE === "sandbox";
  const baseUrl = isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

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
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to suspend subscription",
    }));

    // If subscription doesn't exist, that's okay - we can proceed anyway
    if (errorData.name === "RESOURCE_NOT_FOUND") {
      console.log("Subscription not found, proceeding anyway");
      return { success: true };
    }

    throw new Error(
      `PayPal subscription suspension failed: ${JSON.stringify(errorData)}`,
    );
  }

  return { success: true };
}

export async function getPayPalSubscriptionUpdatePaymentUrl(
  subscriptionId: string,
  returnUrl: string,
): Promise<{ approvalUrl: string }> {
  const isSandbox = process.env.PAYPAL_MODE === "sandbox";

  // Get subscription details first to find the edit link
  const subscription = await getPayPalSubscription(subscriptionId);

  // PayPal provides an "edit" link in the subscription response for updating payment methods
  const editLink = subscription.links?.find(
    (link: { rel: string; href: string }) => link.rel === "edit",
  );

  if (editLink) {
    // Append return URL to the edit link
    const separator = editLink.href.includes("?") ? "&" : "?";
    return {
      approvalUrl: `${editLink.href}${separator}return_url=${encodeURIComponent(
        returnUrl,
      )}`,
    };
  }

  // Fallback: Redirect to PayPal subscription management page
  // Users can update payment method through PayPal's customer portal
  const baseUrl = isSandbox
    ? "https://www.sandbox.paypal.com"
    : "https://www.paypal.com";
  return {
    approvalUrl: `${baseUrl}/myaccount/autopay/connect/${subscriptionId}?returnUrl=${encodeURIComponent(
      returnUrl,
    )}`,
  };
}

/**
 * Get subscription transactions (billing history) for a PayPal subscription
 */
export async function getPayPalSubscriptionTransactions(
  subscriptionId: string,
  startTime?: string,
  endTime?: string,
) {
  const accessToken = await getPayPalAccessToken();
  const isSandbox = process.env.PAYPAL_MODE === "sandbox";
  const baseUrl = isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

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
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to get transactions",
    }));
    throw new Error(
      `Failed to get PayPal subscription transactions: ${JSON.stringify(
        errorData,
      )}`,
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

export function formatPayPalTransactionToInvoice(
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
  planDescription: string,
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
