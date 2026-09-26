import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/modules/shared/lib/auth";
import connectDB from "@/modules/shared/lib/db";
import User from "@/modules/shared/models/User";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

function getPriceMap(): Record<string, string | undefined> {
  return {
    monthly: process.env.STRIPE_PRICE_MONTHLY,
    yearly: process.env.STRIPE_PRICE_YEARLY,
    credits_10: process.env.STRIPE_PRICE_CREDITS_10,
  };
}

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured. Missing STRIPE_SECRET_KEY." },
      { status: 503 },
    );
  }

  if (secretKey.startsWith("pk_")) {
    return NextResponse.json(
      {
        error:
          "Invalid STRIPE_SECRET_KEY: A publishable key (pk_...) was provided instead of a secret key (sk_... or rk_...). Please update .env.local with your Stripe Secret Key.",
      },
      { status: 500 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Failed to initialize Stripe client" },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = (await request.json()) as { plan: string };
  const priceMap = getPriceMap();
  const priceId = priceMap[plan];
  if (!priceId) {
    return NextResponse.json({ error: `Invalid plan or price not configured for "${plan}"` }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const appUrl =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3000";

  const isSubscription = !plan.startsWith("credits");

  // Validate that customer ID actually exists in the current Stripe account
  let customerId = user.stripeCustomerId;
  if (customerId) {
    try {
      const retrieved = await stripe.customers.retrieve(customerId);
      if ("deleted" in retrieved && retrieved.deleted) {
        customerId = undefined;
        user.stripeCustomerId = undefined;
        await user.save();
      }
    } catch {
      // Customer belongs to an old/different Stripe account or was deleted
      customerId = undefined;
      user.stripeCustomerId = undefined;
      await user.save();
    }
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      customer: customerId || undefined,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${appUrl}/dashboard?checkout=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      metadata: {
        userId: session.user.id,
        userEmail: user.email,
        plan,
      },
      subscription_data: isSubscription
        ? {
            metadata: {
              userId: session.user.id,
              plan,
            },
          }
        : undefined,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Stripe checkout session creation failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
