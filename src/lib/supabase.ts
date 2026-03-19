import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://euszgnaahwmdbfdewaky.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1c3pnbmFhaHdtZGJmZGV3YWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2Njk5NTAsImV4cCI6MjA4OTI0NTk1MH0.oTg96pXF8PraxphGOCszHuP8SoMpCBDXL6C48OrNbEI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Plan = 'free' | 'pro' | 'studio' | 'business' | 'unlimited';

// ═══════════════════════════════════════════════════
// CANONICAL PRICING — single source of truth
// DO NOT edit prices in individual pages — edit here only
// Last updated: March 2026 (by אילון)
// ═══════════════════════════════════════════════════

export const CREDIT_COSTS = {
  analysis: 50,   // 1 song analysis
  viral: 150,     // 1 viral song generation (Suno V5)
} as const;

export const PLAN_LIMITS = {
  free: {
    label: 'Free',
    price: 0,
    monthlyCredits: 0,
    signupCredits: 50,       // one-time gift on registration
    analyses: 1,
    remixes: 0,
    badge: null,
    highlight: false,
  },
  pro: {
    label: 'Pro',
    price: 29,               // $29/month
    monthlyCredits: 500,     // 500 credits refreshed each month
    signupCredits: 500,
    analyses: 999,
    remixes: 999,
    badge: 'MOST POPULAR',
    highlight: true,
  },
  studio: {
    label: 'Studio',
    price: 59,               // $59/month
    monthlyCredits: 1000,    // 1000 credits refreshed each month
    signupCredits: 1000,
    analyses: 999,
    remixes: 999,
    badge: 'BEST VALUE',
    highlight: false,
  },
  // Legacy aliases — map to nearest current plan
  business: {
    label: 'Studio',
    price: 59,
    monthlyCredits: 1000,
    signupCredits: 1000,
    analyses: 999,
    remixes: 999,
    badge: null,
    highlight: false,
  },
  unlimited: {
    label: 'Studio',
    price: 59,
    monthlyCredits: 1000,
    signupCredits: 1000,
    analyses: 999,
    remixes: 999,
    badge: null,
    highlight: false,
  },
};

// Credit packs — one-time purchases, credits never expire
// analysis=50cr, viral=150cr
export const CREDIT_PACKS = [
  {
    id: 'starter',
    credits: 250,
    price: 9,
    label: '250 Credits',
    desc: `${Math.floor(250 / CREDIT_COSTS.analysis)} analyses or ${Math.floor(250 / CREDIT_COSTS.viral)} viral song`,
    popular: false,
    savings: null,
    badge: null,
  },
  {
    id: 'popular',
    credits: 600,
    price: 19,
    label: '600 Credits',
    desc: `${Math.floor(600 / CREDIT_COSTS.analysis)} analyses or ${Math.floor(600 / CREDIT_COSTS.viral)} viral songs`,
    popular: true,
    savings: 'BEST VALUE',
    badge: 'MOST POPULAR',
  },
  {
    id: 'pro',
    credits: 1500,
    price: 39,
    label: '1,500 Credits',
    desc: `${Math.floor(1500 / CREDIT_COSTS.analysis)} analyses or ${Math.floor(1500 / CREDIT_COSTS.viral)} viral songs`,
    popular: false,
    savings: '25% off',
    badge: null,
  },
];

// ═══════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════

/** Monthly credit allotment for a given plan */
export const getMonthlyCredits = (plan: Plan): number =>
  PLAN_LIMITS[plan]?.monthlyCredits ?? 0;

/** Credit balance color based on level */
export const creditBalanceColor = (credits: number, plan: Plan): string => {
  const monthly = PLAN_LIMITS[plan]?.monthlyCredits || PLAN_LIMITS[plan]?.signupCredits || 50;
  const pct = monthly > 0 ? (credits / monthly) * 100 : 0;
  if (credits <= 0) return 'text-destructive';
  if (pct <= 10 || credits < CREDIT_COSTS.analysis) return 'text-red-400';
  if (pct <= 25) return 'text-amber-400';
  return 'text-emerald-400';
};

/** How many of each action credits can buy */
export const creditsToActions = (credits: number) => ({
  analyses: Math.floor(credits / CREDIT_COSTS.analysis),
  viral: Math.floor(credits / CREDIT_COSTS.viral),
});

// ═══════════════════════════════════════════════════
// PROFILE CREDIT REFRESH
// ═══════════════════════════════════════════════════

export const refreshMonthlyCredits = async (userId: string, plan: Plan) => {
  const monthly = PLAN_LIMITS[plan]?.monthlyCredits ?? 0;
  if (!monthly) return null;
  const { data, error } = await supabase
    .from('profiles')
    .update({ credits: monthly, credits_refreshed_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) console.error('refreshMonthlyCredits error:', error);
  return data;
};

export const deductCredits = async (userId: string, amount: number): Promise<boolean> => {
  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
  });
  if (error) { console.error('deductCredits error:', error); return false; }
  return data === true;
};
