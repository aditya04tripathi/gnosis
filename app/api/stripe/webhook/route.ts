import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectDB from "@/modules/shared/lib/db";
import ProcessedStripeEvent, {
  type ProcessedStripeEventDocument,
} from "@/modules/shared/models/ProcessedStripeEvent";
import User from "@/modules/shared/models/User";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const PROCESSING_LEASE_MS = 5 * 60 * 1000;

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

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
  let processedEvent: ProcessedStripeEventDocument | null = null;
  try {
    processedEvent = await ProcessedStripeEvent.create({ eventId: event.id });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;

    const existing = await ProcessedStripeEvent.findOne({ eventId: event.id });
    if (!existing || existing.status === "processed" || !existing.status) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    processedEvent = await ProcessedStripeEvent.findOneAndUpdate(
      {
        _id: existing._id,
        $or: [
          { status: "failed" },
          {
            status: "processing",
            processingStartedAt: {
              $lte: new Date(Date.now() - PROCESSING_LEASE_MS),
            },
          },
        ],
      },
      {
        $set: {
          status: "processing",
          processingStartedAt: new Date(),
        },
        $unset: { failedAt: 1, failureMessage: 1 },
      },
      { new: true },
    );
    if (!processedEvent) {
      return NextResponse.json(
        { error: "Event is already being processed" },
        { status: 500 },
      );
    }
  }

  if (!processedEvent) {
    return NextResponse.json(
      { error: "Event claim was lost; retry delivery" },
      { status: 500 },
    );
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid") {
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (userId && plan) {
          if (plan === "monthly" || plan === "pro_monthly") {
            await User.findByIdAndUpdate(userId, {
              subscriptionTier: "MONTHLY",
              searchesResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              ...(customerId ? { stripeCustomerId: customerId } : {}),
              ...(subscriptionId
                ? { stripeSubscriptionId: subscriptionId }
                : {}),
            });
          } else if (plan === "yearly" || plan === "pro_yearly") {
            await User.findByIdAndUpdate(userId, {
              subscriptionTier: "YEARLY",
              searchesResetAt: new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000,
              ),
              ...(customerId ? { stripeCustomerId: customerId } : {}),
              ...(subscriptionId
                ? { stripeSubscriptionId: subscriptionId }
                : {}),
            });
          } else if (plan.startsWith("ultra")) {
            await User.findByIdAndUpdate(userId, {
              subscriptionTier: "ULTRA",
              searchesResetAt: new Date(
                Date.now() + (plan.includes("yearly") ? 365 : 30) * 24 * 60 * 60 * 1000,
              ),
              ...(customerId ? { stripeCustomerId: customerId } : {}),
              ...(subscriptionId
                ? { stripeSubscriptionId: subscriptionId }
                : {}),
            });
          } else if (plan === "credits_10") {
            await User.findByIdAndUpdate(userId, {
              $inc: { searchesUsed: -10 },
              ...(customerId ? { stripeCustomerId: customerId } : {}),
            });
          }
        }
      }
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;
      const status = subscription.status;

      if (status === "active" || status === "trialing") {
        const priceId = subscription.items.data[0]?.price.id;
        const interval =
          subscription.items.data[0]?.price.recurring?.interval;
        
        let tier: "FREE" | "MONTHLY" | "YEARLY" | "ULTRA" = "MONTHLY";
        if (
          priceId === process.env.STRIPE_PRICE_ULTRA_MONTHLY ||
          priceId === process.env.STRIPE_PRICE_ULTRA_YEARLY
        ) {
          tier = "ULTRA";
        } else if (
          priceId === process.env.STRIPE_PRICE_YEARLY ||
          interval === "year"
        ) {
          tier = "YEARLY";
        }

        await User.findOneAndUpdate(
          {
            $or: [
              { stripeSubscriptionId: subscription.id },
              { stripeCustomerId: customerId },
            ],
          },
          {
            subscriptionTier: tier,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customerId,
          },
        );
      } else if (status === "canceled" || status === "unpaid") {
        await User.findOneAndUpdate(
          {
            $or: [
              { stripeSubscriptionId: subscription.id },
              { stripeCustomerId: customerId },
            ],
          },
          {
            subscriptionTier: "FREE",
            stripeSubscriptionId: null,
          },
        );
      }
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;
      await User.findOneAndUpdate(
        {
          $or: [
            { stripeSubscriptionId: subscription.id },
            { stripeCustomerId: customerId },
          ],
        },
        {
          subscriptionTier: "FREE",
          stripeSubscriptionId: null,
        },
      );
    }

    await ProcessedStripeEvent.updateOne(
      { _id: processedEvent._id, status: "processing" },
      { $set: { status: "processed", processedAt: new Date() } },
    );
    return NextResponse.json({ received: true });
  } catch (error) {
    const failureMessage =
      error instanceof Error
        ? error.message.slice(0, 500)
        : "Unknown fulfillment error";
    await ProcessedStripeEvent.updateOne(
      { _id: processedEvent._id, status: "processing" },
      {
        $set: {
          status: "failed",
          failedAt: new Date(),
          failureMessage,
        },
      },
    );
    console.error("Stripe webhook fulfillment error:", error);
    return NextResponse.json(
      { error: "Webhook fulfillment failed" },
      { status: 500 },
    );
  }
}
