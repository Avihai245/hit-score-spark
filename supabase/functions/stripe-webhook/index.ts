import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const PRICE_TO_PLAN: Record<string, string> = {};

async function getPlanForPrice(priceId: string): Promise<string> {
  // Look up the price to determine the plan
  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const product = price.product as Stripe.Product;
    const planName = product.metadata?.plan || product.name?.toLowerCase() || "";
    if (planName.includes("studio")) return "studio";
    if (planName.includes("pro")) return "pro";
    return "pro"; // Default paid plan
  } catch {
    return "pro";
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) return;

  if (session.mode === "subscription") {
    const subscriptionId = session.subscription as string;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price.id;
    const plan = await getPlanForPrice(priceId);

    await supabase.from("viralize_users").update({
      stripe_subscription_id: subscriptionId,
      subscription_status: subscription.status,
      plan,
      plan_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
    }).eq("id", userId);
  } else if (session.mode === "payment") {
    // One-time credit purchase
    const amount = session.amount_total ? session.amount_total / 100 : 0;
    const credits = Math.floor(amount); // 1 credit per dollar simplified

    // Add credits
    const { data: profile } = await supabase
      .from("viralize_users")
      .select("credits")
      .eq("id", userId)
      .single();

    await supabase.from("viralize_users").update({
      credits: (profile?.credits || 0) + credits,
    }).eq("id", userId);

    // Record transaction
    await supabase.from("viralize_credits").insert({
      user_id: userId,
      amount,
      type: "purchase",
      stripe_payment_id: session.payment_intent as string,
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) {
    // Try to find by customer ID
    const { data: profile } = await supabase
      .from("viralize_users")
      .select("id")
      .eq("stripe_customer_id", subscription.customer as string)
      .single();
    if (!profile) return;

    const priceId = subscription.items.data[0]?.price.id;
    const plan = await getPlanForPrice(priceId);

    await supabase.from("viralize_users").update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      plan: subscription.status === "active" ? plan : "free",
      plan_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
    }).eq("id", profile.id);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const plan = await getPlanForPrice(priceId);

  await supabase.from("viralize_users").update({
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    plan: subscription.status === "active" ? plan : "free",
    plan_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
  }).eq("id", userId);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  await supabase.from("viralize_users").update({
    subscription_status: "cancelled",
    plan: "free",
    stripe_subscription_id: null,
  }).eq("stripe_customer_id", customerId);
}

serve(async (req) => {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // For development without webhook signing
      event = JSON.parse(body) as Stripe.Event;
    }

    console.log(`Stripe event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await handleSubscriptionUpdated(sub);
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await supabase.from("viralize_users").update({
          subscription_status: "past_due",
        }).eq("stripe_customer_id", customerId);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
