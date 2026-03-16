import { loadStripe } from '@stripe/stripe-js';

// Test mode publishable key - replace with real key in Amplify env vars
export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
);

// Price IDs - set these in Amplify environment variables
export const PRICES = {
  pro_monthly: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
  studio_monthly: import.meta.env.VITE_STRIPE_STUDIO_PRICE_ID || 'price_studio_monthly',
  analysis_credit: import.meta.env.VITE_STRIPE_ANALYSIS_CREDIT || 'price_analysis',
  remix_credit: import.meta.env.VITE_STRIPE_REMIX_CREDIT || 'price_remix',
  analysis_5pack: import.meta.env.VITE_STRIPE_ANALYSIS_5PACK || 'price_analysis_5pack',
  remix_3pack: import.meta.env.VITE_STRIPE_REMIX_3PACK || 'price_remix_3pack',
};

/**
 * Redirects to Stripe Checkout for the given price.
 * TODO: Call backend API to create a real Stripe checkout session.
 * For now this is a placeholder that shows a "coming soon" signal.
 */
export const createCheckoutSession = async (
  _priceId: string,
  _userId: string
): Promise<null> => {
  // TODO: POST to /api/stripe/create-checkout-session
  // const res = await fetch('/api/stripe/create-checkout-session', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ priceId: _priceId, userId: _userId }),
  // });
  // const { url } = await res.json();
  // window.location.href = url;
  return null;
};

/**
 * Opens the Stripe Customer Portal so users can manage their subscription.
 * TODO: Call backend API to create a portal session.
 */
export const openCustomerPortal = async (_userId: string): Promise<null> => {
  // TODO: POST to /api/stripe/create-portal-session
  return null;
};
