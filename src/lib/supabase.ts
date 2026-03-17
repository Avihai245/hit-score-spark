import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://euszgnaahwmdbfdewaky.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1c3pnbmFhaHdtZGJmZGV3YWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2Njk5NTAsImV4cCI6MjA4OTI0NTk1MH0.oTg96pXF8PraxphGOCszHuP8SoMpCBDXL6C48OrNbEI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Plan = 'free' | 'pro' | 'studio';

export const PLAN_LIMITS = {
  free: { analyses: 1, remixes: 0, label: 'Free', price: 0 },
  pro: { analyses: 999, remixes: 10, label: 'Pro', price: 19 },
  studio: { analyses: 999, remixes: 999, label: 'Studio', price: 29 },
};

// Credit costs
export const CREDIT_COSTS = {
  analysis: 35,
  remix: 85,
};

// Credit packs (PAYG)
export const CREDIT_PACKS = [
  { credits: 100, price: 10, label: '100 Credits', popular: false },
  { credits: 300, price: 25, label: '300 Credits', popular: true, savings: '17%' },
  { credits: 500, price: 40, label: '500 Credits', popular: false, savings: '20%' },
];
