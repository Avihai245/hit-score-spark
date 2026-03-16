import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ueomytgixpnrlnjfretr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlb215dGdpeHBucmxuamZyZXRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDgwMzAsImV4cCI6MjA4OTE4NDAzMH0.2WcxGKCGGXIcNXc1ANfk9X95nDmpB6VUskbmAhd6gro';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Plan = 'free' | 'payg' | 'pro' | 'studio';

export const PLAN_LIMITS = {
  free: { analyses: 1, remixes: 0, label: 'Free' },
  payg: { analyses: 999, remixes: 999, label: 'Pay As You Go' },
  pro: { analyses: 999, remixes: 4, label: 'Pro', price: 29 },
  studio: { analyses: 999, remixes: 8, label: 'Studio', price: 49 },
};
