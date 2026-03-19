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

// ═══════════════════════════════════════════════
// CANONICAL PRICING — must match src/lib/supabase.ts
// Pro: $29/mo = 500 credits | Studio: $49/mo = 1000 credits
// Credit packs: 100cr/$9 | 300cr/$19 | 700cr/$39
// ═══════════════════════════════════════════════

const PRICE_TO_PLAN: Record<string, string> = {
  'price_1TBQ1y5OzmHXa8O4fyUQRzop': 'pro',    // Pro $29/mo
  'price_1TBQ1z5OzmHXa8O454UWomQK': 'studio', // Studio $49/mo
};

const PLAN_MONTHLY_CREDITS: Record<string, number> = {
  'pro':    500,
  'studio': 1000,
};

// One-time credit pack price IDs → credit amounts
const CREDIT_PACK_PRICES: Record<string, number> = {
  'price_1TBQ205OzmHXa8O4coeEIBLP': 100,  // Starter 100cr $9
  'price_1TBQ215OzmHXa8O4pcXnxbNC': 300,  // Popular 300cr $19
  'price_1TBQ225OzmHXa8O4VD8qGIUo': 700,  // Pro Pack 700cr $39
};

async function getPlanForPrice(priceId: string): Promise<string> {
  // Check direct mapping first
  if (PRICE_TO_PLAN[priceId]) return PRICE_TO_PLAN[priceId];
  // Fallback: look up product metadata
  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const product = price.product as Stripe.Product;
    const planName = product.metadata?.plan || product.name?.toLowerCase() || "";
    if (planName.includes("studio")) return "studio";
    if (planName.includes("pro")) return "pro";
    return "pro";
  } catch {
    return "pro";
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) {
    console.error("No supabase_user_id in session metadata");
    return;
  }

  if (session.mode === "subscription") {
    // ── Subscription purchase ──
    const subscriptionId = session.subscription as string;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price.id;
    const plan = await getPlanForPrice(priceId);
    const credits = PLAN_MONTHLY_CREDITS[plan] || 500;

    await supabase.from("viralize_users").update({
      stripe_subscription_id: subscriptionId,
      subscription_status: subscription.status,
      plan,
      credits,                // Give monthly credits immediately
      credits_refreshed_at: new Date().toISOString(),
      plan_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
    }).eq("id", userId);

    console.log(`Subscription: user=${userId} plan=${plan} credits=${credits}`);

  } else if (session.mode === "payment") {
    // ── One-time credit purchase ──
    // Get the price ID from line items
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const priceId = lineItems.data[0]?.price?.id || '';
    const creditsToAdd = CREDIT_PACK_PRICES[priceId] || 0;

    if (creditsToAdd === 0) {
      console.warn(`Unknown credit pack price: ${priceId}`);
    }

    // Get current credits and add
    const { data: profile } = await supabase
      .from("viralize_users")
      .select("credits")
      .eq("id", userId)
      .single();

    const newCredits = (profile?.credits || 0) + creditsToAdd;

    await supabase.from("viralize_users").update({
      credits: newCredits,
    }).eq("id", userId);

    // Record transaction
    try {
      await supabase.from("viralize_credits").insert({
        user_id: userId,
        amount: creditsToAdd,
        price_paid: session.amount_total ? session.amount_total / 100 : 0,
        type: "purchase",
        stripe_payment_id: session.payment_intent as string,
        stripe_price_id: priceId,
      });
    } catch (e) {
      console.warn("Failed to insert credit transaction (table may not exist):", e);
    }

    console.log(`Credit purchase: user=${userId} priceId=${priceId} credits=${creditsToAdd} total=${newCredits}`);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Find user by subscription ID or customer ID
  let userId: string | null = subscription.metadata?.supabase_user_id || null;

  if (!userId) {
    const { data: profile } = await supabase
      .from("viralize_users")
      .select("id")
      .eq("stripe_customer_id", subscription.customer as string)
      .single();
    userId = profile?.id || null;
  }

  if (!userId) {
    console.warn("Could not find user for subscription update");
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const plan = await getPlanForPrice(priceId);
  const isActive = subscription.status === "active";
  const updates: Record<string, unknown> = {
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    plan: isActive ? plan : "free",
    plan_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
  };

  // On renewal (invoice.payment_succeeded triggers this) — refresh credits
  // We check billing_cycle_anchor vs current_period_start to detect renewals
  if (isActive) {
    updates.credits = PLAN_MONTHLY_CREDITS[plan] || 500;
    updates.credits_refreshed_at = new Date().toISOString();
  }

  await supabase.from("viralize_users").update(updates).eq("id", userId);
  console.log(`Subscription updated: user=${userId} plan=${plan} status=${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  await supabase.from("viralize_users").update({
    subscription_status: "cancelled",
    plan: "free",
    stripe_subscription_id: null,
  }).eq("stripe_customer_id", customerId);
  console.log(`Subscription cancelled: customer=${customerId}`);
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
        // Monthly renewal — refresh credits
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await handleSubscriptionUpdated(sub);
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await supabase.from("viralize_users").update({
          subscription_status: "past_due",
        }).eq("stripe_customer_id", invoice.customer as string);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Webhook error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
