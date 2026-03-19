import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
);

// ═══════════════════════════════════════════════════════
// STRIPE PRICE IDs — must match supabase/functions/stripe-webhook/index.ts
// Pro $29/mo | Studio $49/mo
// Credit packs: 100cr=$9 | 300cr=$19 | 700cr=$39
// ═══════════════════════════════════════════════════════
export const PRICES = {
  // Subscriptions
  pro_monthly:    import.meta.env.VITE_STRIPE_PRO_PRICE_ID    || 'price_1TBQ1y5OzmHXa8O4fyUQRzop',
  studio_monthly: import.meta.env.VITE_STRIPE_STUDIO_PRICE_ID || 'price_1TBQ1z5OzmHXa8O454UWomQK',
  // Credit packs (one-time)
  credits_100:    import.meta.env.VITE_STRIPE_CREDITS_100     || 'price_1TBQ205OzmHXa8O4coeEIBLP', // 100cr $9
  credits_300:    import.meta.env.VITE_STRIPE_CREDITS_300     || 'price_1TBQ215OzmHXa8O4pcXnxbNC', // 300cr $19
  credits_700:    import.meta.env.VITE_STRIPE_CREDITS_700     || 'price_1TBQ225OzmHXa8O4VD8qGIUo', // 700cr $39
  // Legacy aliases (backward compat)
  analysis_credit: import.meta.env.VITE_STRIPE_CREDITS_100    || 'price_1TBQ205OzmHXa8O4coeEIBLP',
  analysis_5pack:  import.meta.env.VITE_STRIPE_CREDITS_300    || 'price_1TBQ215OzmHXa8O4pcXnxbNC',
  remix_3pack:     import.meta.env.VITE_STRIPE_CREDITS_700    || 'price_1TBQ225OzmHXa8O4VD8qGIUo',
  remix_credit:    import.meta.env.VITE_STRIPE_CREDITS_100    || 'price_1TBQ205OzmHXa8O4coeEIBLP',
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://euszgnaahwmdbfdewaky.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1c3pnbmFhaHdtZGJmZGV3YWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2Njk5NTAsImV4cCI6MjA4OTI0NTk1MH0.oTg96pXF8PraxphGOCszHuP8SoMpCBDXL6C48OrNbEI';

// Creates Stripe Checkout Session via Supabase Edge Function
export const createCheckoutSession = async (
  priceId: string,
  userId: string,
  mode: 'subscription' | 'payment' = 'subscription'
) => {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/stripe-checkout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          priceId,
          userId,
          mode,
          successUrl: `${window.location.origin}/dashboard/billing?payment=success`,
          cancelUrl: `${window.location.origin}/dashboard/billing`,
        }),
      }
    );

    const result = await response.json();

    if (result.data?.url) {
      window.location.href = result.data.url;
      return 'redirect';
    } else if (result.error) {
      console.error('Checkout error:', result.error);
      return null;
    }
    return null;
  } catch (err) {
    console.error('Checkout failed:', err);
    return null;
  }
};

// Opens Stripe Customer Portal for managing subscription
export const openCustomerPortal = async (userId: string) => {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/stripe-portal`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ userId }),
      }
    );

    const result = await response.json();

    if (result.data?.url) {
      window.location.href = result.data.url;
      return 'redirect';
    } else if (result.error) {
      console.error('Portal error:', result.error);
      return null;
    }
    return null;
  } catch (err) {
    console.error('Portal failed:', err);
    return null;
  }
};
