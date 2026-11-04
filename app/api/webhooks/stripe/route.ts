import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import db from "@/db/drizzle";
import { stripe } from "@/lib/stripe";
import { userSubscription } from "@/db/schema";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch(error: any) {
    return new NextResponse(`Webhook error: ${error.message}`, {
      status: 400,
    });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (!session?.metadata?.userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await db.insert(userSubscription).values({
      userId: session.metadata.userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(
        subscription.current_period_end * 1000,
      ),
    });
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;

    // Invoice.subscription moved to invoice.parent.subscription_details.subscription
    // in newer Stripe API versions; this reads whichever shape is present.
    const subscriptionId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : (invoice as unknown as {
            parent?: { subscription_details?: { subscription?: string | null } };
          }).parent?.subscription_details?.subscription;

    if (!subscriptionId) {
      return new NextResponse("Subscription ID is required", { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    await db.update(userSubscription).set({
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(
        subscription.current_period_end * 1000,
      ),
    }).where(eq(userSubscription.stripeSubscriptionId, subscription.id))
  }

  return new NextResponse(null, { status: 200 });
};
