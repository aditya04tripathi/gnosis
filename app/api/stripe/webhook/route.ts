import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectDB from "@/modules/shared/lib/db";
import User from "@/modules/shared/models/User";
import ProcessedStripeEvent from "@/modules/shared/models/ProcessedStripeEvent";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function POST(request: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await connectDB();
  try {
    await ProcessedStripeEvent.create({ eventId: event.id });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === 11000) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw error;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;

    if (userId && plan) {
      if (plan === "monthly") {
        await User.findByIdAndUpdate(userId, { subscriptionTier: "MONTHLY" });
      } else if (plan === "yearly") {
        await User.findByIdAndUpdate(userId, { subscriptionTier: "YEARLY" });
      } else if (plan === "credits_10") {
        await User.findByIdAndUpdate(userId, { $inc: { searchesUsed: -10 } });
      }
    }
  }

  return NextResponse.json({ received: true });
}
