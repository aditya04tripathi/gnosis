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

export async function POST(_request: Request) {
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
          "Invalid STRIPE_SECRET_KEY: A publishable key (pk_...) was provided instead of a secret key (sk_... or rk_...).",
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
      customerId = undefined;
      user.stripeCustomerId = undefined;
      await user.save();
    }
  }

  if (!customerId) {
    // Try to find customer by email in Stripe
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      user.stripeCustomerId = customerId;
      await user.save();
    }
  }

  if (!customerId) {
    return NextResponse.json(
      {
        error:
          "No billing record found. Upgrade to a paid plan to manage subscription.",
        redirectUrl: "/pricing",
      },
      { status: 400 },
    );
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/profile`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Failed to create Stripe portal session:", error);
    return NextResponse.json(
      { error: "Unable to access billing portal at this time" },
      { status: 500 },
    );
  }
}
