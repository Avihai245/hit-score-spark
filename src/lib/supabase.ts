import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://euszgnaahwmdbfdewaky.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Plan = 'free' | 'payg' | 'pro' | 'studio';

export const PLAN_LIMITS = {
  free: { analyses: 1, remixes: 0, label: 'Free' },
  payg: { analyses: 999, remixes: 999, label: 'Pay As You Go' },
  pro: { analyses: 999, remixes: 10, label: 'Pro', price: 29 },
  studio: { analyses: 999, remixes: 999, label: 'Studio', price: 49 },
};
