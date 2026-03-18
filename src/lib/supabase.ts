import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Plan = 'free' | 'pro' | 'studio' | 'business' | 'unlimited';

export const PLAN_LIMITS = {
  free:      { analyses: 1,   remixes: 0,    label: 'Free',      price: 0 },
  pro:       { analyses: 999, remixes: 4,    label: 'Pro',       price: 19 },
  studio:    { analyses: 999, remixes: 10,   label: 'Studio',    price: 29 },
  business:  { analyses: 999, remixes: 20,   label: 'Business',  price: 49 },
  unlimited: { analyses: 999, remixes: 999,  label: 'Unlimited', price: 79 },
};

// Credit costs
export const CREDIT_COSTS = {
  analysis: 35,
  remix: 85,
};

// Credit packs (PAYG) — base: 100cr = $19
export const CREDIT_PACKS = [
  { credits: 100,  price: 19, label: '100 Credits',  popular: false },
  { credits: 300,  price: 49, label: '300 Credits',  popular: true,  savings: '14%' },
  { credits: 500,  price: 79, label: '500 Credits',  popular: false, savings: '17%' },
];
