import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://euszgnaahwmdbfdewaky.supabase.co';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1c3pnbmFhaHdtZGJmZGV3YWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2Njk5NTAsImV4cCI6MjA4OTI0NTk1MH0.oTg96pXF8PraxphGOCszHuP8SoMpCBDXL6C48OrNbEI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Plan = 'free' | 'pro' | 'studio' | 'business' | 'unlimited';

export const CREDIT_COSTS = { analysis: 50, viral: 150 } as const;

export const PLAN_LIMITS = {
  free:     { label: 'Free',   price: 0,  monthlyCredits: 0,    signupCredits: 100,  analyses: 2,   remixes: 0,   badge: null,           highlight: false },
  pro:      { label: 'Pro',    price: 19, monthlyCredits: 600,  signupCredits: 600,  analyses: 999, remixes: 999, badge: 'MOST POPULAR',  highlight: true  },
  studio:   { label: 'Studio', price: 39, monthlyCredits: 1800, signupCredits: 1800, analyses: 999, remixes: 999, badge: 'BEST VALUE',    highlight: false },
  business: { label: 'Studio', price: 39, monthlyCredits: 1800, signupCredits: 1800, analyses: 999, remixes: 999, badge: null,           highlight: false },
  unlimited:{ label: 'Studio', price: 39, monthlyCredits: 1800, signupCredits: 1800, analyses: 999, remixes: 999, badge: null,           highlight: false },
};

export const CREDIT_PACKS = [
  { id: 'starter', credits: 100, price: 12, label: '100 Credits', desc: '2 scans', popular: false, badge: null, savings: null },
  { id: 'popular', credits: 250, price: 25, label: '250 Credits', desc: '5 scans or 1 Algorithm Hit', popular: true, badge: 'MOST POPULAR', savings: null },
  { id: 'pro',     credits: 600, price: 49, label: '600 Credits', desc: '12 scans or 4 Algorithm Hits', popular: false, badge: null, savings: 'Best value' },
];

export const creditBalanceColor = (credits: number, plan: Plan): string => { const monthly = PLAN_LIMITS[plan]?.monthlyCredits || 100; const pct = monthly > 0 ? (credits/monthly)*100 : 0; if (credits<=0) return 'text-destructive'; if (credits<50) return 'text-red-400'; if (pct<=25) return 'text-amber-400'; return 'text-emerald-400'; };

export const creditsToActions = (credits: number) => ({ analyses: Math.floor(credits/50), viral: Math.floor(credits/150) });

const SB_URL = import.meta.env.VITE_SUPABASE_URL || 'https://euszgnaahwmdbfdewaky.supabase.co';

const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1c3pnbmFhaHdtZGJmZGV3YWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2Njk5NTAsImV4cCI6MjA4OTI0NTk1MH0.oTg96pXF8PraxphGOCszHuP8SoMpCBDXL6C48OrNbEI';

export const deductCredits = async (userId: string, amount: number) => { try { const r = await fetch(`${SB_URL}/functions/v1/deduct-credits`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${SB_KEY}`},body:JSON.stringify({userId,amount})}); const d=await r.json(); return {success:d.success===true,newCredits:d.credits}; } catch { return {success:false}; } };
