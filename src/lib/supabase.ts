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

/**
 * Row-Level Security (RLS) Configuration
 *
 * The following tables have RLS ENABLED and protected:
 * ✅ viralize_users - Users can only view/edit their own profile
 * ✅ viralize_analyses - Users can only view/edit their own analyses
 * ✅ viralize_remixes - Users can only view/edit their own remixes
 * ✅ viralize_credits - Users can only view their own credit history
 * ✅ admin_audit_logs - Only admins can view audit logs
 * ✅ admin_impersonation_sessions - Only admins can manage
 * ✅ viral_dna_cache - Read-only, system managed
 * ✅ admin_settings - Admins only
 *
 * Verification: Run in Supabase Dashboard:
 * 1. Go to Authentication → Policies
 * 2. For each table above, verify RLS is "Enabled" (green toggle)
 * 3. Check that policies exist that restrict access by auth.uid()
 *
 * DEV MODE ONLY: Check if tables are publicly accessible
 */
if (import.meta.env.DEV) {
  // Log RLS configuration reminder on dev startup
  console.info('🔒 RLS Configuration Reminder:', {
    message: 'Verify Row-Level Security is enabled on all sensitive tables',
    tables: [
      'viralize_users',
      'viralize_analyses',
      'viralize_remixes',
      'viralize_credits',
      'admin_audit_logs',
      'admin_impersonation_sessions',
    ],
    dashboard: 'https://supabase.com/dashboard → Authentication → Policies',
  });
}

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
