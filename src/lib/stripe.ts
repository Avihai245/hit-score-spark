import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
);

export const PRICES = {
  pro_monthly:      import.meta.env.VITE_STRIPE_PRO_PRICE_ID     || 'price_1TBQ1y5OzmHXa8O4fyUQRzop',
  studio_monthly:   import.meta.env.VITE_STRIPE_STUDIO_PRICE_ID  || 'price_1TBQ1z5OzmHXa8O454UWomQK',
  analysis_credit:  import.meta.env.VITE_STRIPE_ANALYSIS_CREDIT  || 'price_1TBQ205OzmHXa8O4coeEIBLP',
  remix_credit:     import.meta.env.VITE_STRIPE_REMIX_CREDIT      || 'price_1TBQ205OzmHXa8O4TxhkFsW4',
  analysis_5pack:   import.meta.env.VITE_STRIPE_ANALYSIS_5PACK   || 'price_1TBQ215OzmHXa8O4pcXnxbNC',
  remix_3pack:      import.meta.env.VITE_STRIPE_REMIX_3PACK       || 'price_1TBQ225OzmHXa8O4VD8qGIUo',
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
  );
}

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
