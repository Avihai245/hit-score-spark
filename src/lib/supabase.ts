import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://euszgnaahwmdbfdewaky.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1c3pnbmFhaHdtZGJmZGV3YWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2Njk5NTAsImV4cCI6MjA4OTI0NTk1MH0.oTg96pXF8PraxphGOCszHuP8SoMpCBDXL6C48OrNbEI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Plan = 'free' | 'pro' | 'studio' | 'business' | 'unlimited';

// ═══════════════════════════════════════════════
// CANONICAL PRICING — SINGLE SOURCE OF TRUTH
// Model: Suno-style subscription credits
// DO NOT edit prices in individual pages — here only
// ═══════════════════════════════════════════════

export const CREDIT_COSTS = {
  analysis: 50,   // 1 song analysis
  viral: 150,     // 1 viral song generation (Suno V5)
} as const;

export const PLAN_LIMITS = {
  free: {
    label: 'Free',
    price: 0,
    monthlyCredits: 0,
    signupCredits: 50,        // 50cr one-time gift = 1 free analysis
    analyses: 1,
    remixes: 0,
    badge: null,
    highlight: false,
  },
  pro: {
    label: 'Pro',
    price: 29,                // $29/month
    monthlyCredits: 500,      // 500 credits/month = 10 analyses or 3 viral
    signupCredits: 500,
    analyses: 999,
    remixes: 999,
    badge: 'MOST POPULAR',
    highlight: true,
  },
  studio: {
    label: 'Studio',
    price: 49,                // $49/month
    monthlyCredits: 1000,     // 1000 credits/month = 20 analyses or 6 viral
    signupCredits: 1000,
    analyses: 999,
    remixes: 999,
    badge: 'BEST VALUE',
    highlight: false,
  },
  // Legacy aliases
  business:  { label: 'Studio', price: 49, monthlyCredits: 1000, signupCredits: 1000, analyses: 999, remixes: 999, badge: null, highlight: false },
  unlimited: { label: 'Studio', price: 49, monthlyCredits: 1000, signupCredits: 1000, analyses: 999, remixes: 999, badge: null, highlight: false },
};

// One-time credit packs — less value per credit than subscription (intentional)
// Subscription: $29 = 500cr → 5.8¢/cr | $49 = 1000cr → 4.9¢/cr
// One-time packs are MORE expensive per credit to incentivize subscription
export const CREDIT_PACKS = [
  {
    id: 'starter',
    credits: 100,
    price: 9,
    label: '100 Credits',
    desc: '2 analyses or try 1 viral song',
    popular: false,
    badge: null,
    savings: null,
    // 9¢/cr — most expensive, just to try
  },
  {
    id: 'popular',
    credits: 300,
    price: 19,
    label: '300 Credits',
    desc: '6 analyses or 2 viral songs',
    popular: true,
    badge: 'MOST POPULAR',
    savings: null,
    // 6.3¢/cr
  },
  {
    id: 'pro',
    credits: 700,
    price: 39,
    label: '700 Credits',
    desc: '14 analyses or 4 viral songs',
    popular: false,
    badge: null,
    savings: 'Best per credit',
    // 5.6¢/cr — still worse than $29/mo subscription at 5.8¢/cr
  },
];

// ═══════════════════════════
// HELPERS
// ═══════════════════════════

export const creditBalanceColor = (credits: number, plan: Plan): string => {
  const monthly = PLAN_LIMITS[plan]?.monthlyCredits || PLAN_LIMITS[plan]?.signupCredits || 50;
  const pct = monthly > 0 ? (credits / monthly) * 100 : (credits / 50) * 100;
  if (credits <= 0) return 'text-destructive';
  if (credits < CREDIT_COSTS.analysis) return 'text-red-400';
  if (pct <= 25) return 'text-amber-400';
  return 'text-emerald-400';
};

export const creditsToActions = (credits: number) => ({
  analyses: Math.floor(credits / CREDIT_COSTS.analysis),
  viral: Math.floor(credits / CREDIT_COSTS.viral),
});

export const deductCredits = async (userId: string, amount: number): Promise<boolean> => {
  const { data, error } = await supabase.rpc('deduct_credits', { p_user_id: userId, p_amount: amount });
  if (error) { console.error('deductCredits error:', error); return false; }
  return data === true;
};

export const refreshMonthlyCredits = async (userId: string, plan: Plan) => {
  const monthly = PLAN_LIMITS[plan]?.monthlyCredits ?? 0;
  if (!monthly) return null;
  const { data, error } = await supabase
    .from('profiles')
    .update({ credits: monthly, credits_refreshed_at: new Date().toISOString() })
    .eq('id', userId).select().single();
  if (error) console.error('refreshMonthlyCredits error:', error);
  return data;
};
