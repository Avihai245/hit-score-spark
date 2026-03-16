import { loadStripe } from '@stripe/stripe-js';

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

// Creates Stripe Checkout Session via Supabase Edge Function
export const createCheckoutSession = async (
  priceId: string,
  userId: string,
  mode: 'subscription' | 'payment' = 'payment'
) => {
  try {
    const { data, error } = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ priceId, userId, mode,
          successUrl: `${window.location.origin}/library?payment=success`,
          cancelUrl: `${window.location.origin}/billing` })
      }
    ).then(r => r.json());

    if (data?.url) {
      window.location.href = data.url;
    } else {
      // Fallback: direct Stripe checkout
      const stripe = await stripePromise;
      if (stripe) {
        await (stripe as any).redirectToCheckout({
          lineItems: [{ price: priceId, quantity: 1 }],
          mode,
          successUrl: `${window.location.origin}/library?payment=success`,
          cancelUrl: `${window.location.origin}/billing`,
        });
      }
    }
  } catch {
    // Show coming soon if backend not ready
    return null;
  }
};
