import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PLAN_LIMITS, CREDIT_COSTS, CREDIT_PACKS, creditBalanceColor } from '@/lib/supabase';
import { createCheckoutSession, openCustomerPortal, PRICES } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Check, ArrowRight, ExternalLink, Calendar, Sparkles, Crown, Zap,
  BarChart2, Star, CreditCard,
} from 'lucide-react';
import type { Plan } from '@/lib/supabase';

/* ─── Credit bar ─── */
const CreditBar = ({ credits, max }: { credits: number; max: number }) => {
  const pct = max > 0 ? Math.min(100, (credits / max) * 100) : 0;
  const color = credits <= 0 ? 'bg-destructive' : pct <= 10 ? 'bg-destructive' : pct <= 25 ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Credits remaining</span>
        <span className={`font-bold tabular-nums ${creditBalanceColor(credits, 'free')}`}>{credits.toLocaleString()}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`}
          initial={{ scaleX: 0 }} animate={{ scaleX: pct / 100 }}
          style={{ transformOrigin: 'left' }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
      </div>
    </div>
  );
};

export default function DashboardBilling() {
  const { user, profile, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const plan = (profile?.plan || 'free') as Plan;
  const credits = profile?.credits ?? 0;
  const planLimits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      toast.success('🎉 Payment successful! Your credits have been added.');
      refreshProfile();
      window.history.replaceState({}, '', '/dashboard/billing');
    }
  }, [searchParams]);

  const handleSubscribe = async (id: string, priceId: string) => {
    if (!user?.id) { toast.error('Sign in first'); return; }
    setLoading(id);
    toast.loading('Redirecting…', { id: 'checkout' });
    const r = await createCheckoutSession(priceId, user.id, 'subscription');
    toast.dismiss('checkout');
    setLoading(null);
    if (r === null) toast.error('Checkout unavailable. Try again.');
  };

  const handleBuyCredits = async (id: string, priceId: string) => {
    if (!user?.id) { toast.error('Sign in first'); return; }
    setLoading(id);
    toast.loading('Redirecting…', { id: 'checkout' });
    const r = await createCheckoutSession(priceId, user.id, 'payment');
    toast.dismiss('checkout');
    setLoading(null);
    if (r === null) toast.error('Checkout unavailable. Try again.');
  };

  const handleManage = async () => {
    if (!user?.id) return;
    toast.loading('Opening billing portal…', { id: 'portal' });
    const r = await openCustomerPortal(user.id);
    toast.dismiss('portal');
    if (r === null) toast.error('Billing portal unavailable. Try again.');
  };

  const isStudio = plan === 'studio' || plan === 'business' || plan === 'unlimited';

  return (
    <DashboardLayout>
      {/* ── Top billing info strip ── */}
      <div className="bg-card border-b border-border px-6 py-3 flex items-center gap-8 flex-wrap text-sm">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Current Plan</p>
          <p className="font-bold text-foreground">{planLimits.label} Plan</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Credits/Month</p>
          <p className="font-bold text-foreground">{planLimits.monthlyCredits ? planLimits.monthlyCredits.toLocaleString() : 'Free'}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Credits Remaining</p>
          <p className={`font-bold tabular-nums ${creditBalanceColor(credits, plan)}`}>{credits.toLocaleString()}</p>
        </div>
        {profile?.plan_expires_at && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Next Billing Date</p>
            <p className="font-bold text-foreground">{new Date(profile.plan_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
        )}
        <div className="ml-auto flex gap-2">
          {profile?.stripe_customer_id && (
            <Button onClick={handleManage} size="sm" variant="outline" className="text-xs h-8">Cancel / Manage</Button>
          )}
          <Button onClick={() => document.getElementById('credits')?.scrollIntoView({ behavior: 'smooth' })} size="sm" className="bg-primary text-primary-foreground text-xs h-8">Buy more credits</Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-8 px-4 pt-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Credits & Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your plan and credits</p>
        </div>

        {/* Current status */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                plan === 'free' ? 'bg-muted' : plan === 'pro' ? 'bg-primary/15' : 'bg-accent/15'
              }`}>
                {plan === 'free' ? <Zap className="w-5 h-5 text-muted-foreground" />
                  : plan === 'pro' ? <Star className="w-5 h-5 text-primary fill-current" />
                  : <Crown className="w-5 h-5 text-accent" />}
              </div>
              <div>
                <p className="font-bold text-foreground">{planLimits.label} Plan</p>
                <p className="text-xs text-muted-foreground">
                  {plan === 'free'
                    ? `${PLAN_LIMITS.free.signupCredits} credits on signup (one-time)`
                    : `${planLimits.monthlyCredits.toLocaleString()} credits / month`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-black tabular-nums ${creditBalanceColor(credits, plan)}`}>
                {credits.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">credits left</p>
            </div>
          </div>

          <CreditBar credits={credits} max={planLimits.monthlyCredits || PLAN_LIMITS.free.signupCredits} />

          {/* What credits buy */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3 text-primary" /> Analyze: <strong className="text-foreground">{CREDIT_COSTS.analysis}cr</strong></span>
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-accent" /> Viral song: <strong className="text-foreground">{CREDIT_COSTS.viral}cr</strong></span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {profile?.stripe_customer_id && (
              <Button onClick={handleManage} size="sm" variant="outline" className="rounded-lg text-xs border-border h-8 gap-1.5">
                <ExternalLink className="w-3 h-3" /> Manage Subscription
              </Button>
            )}
            {profile?.plan_expires_at && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                Renews {new Date(profile.plan_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>

        {/* Plans */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-foreground">Subscription Plans</h2>

          {/* Free */}
          <div className={`rounded-2xl border p-4 flex items-center gap-4 ${plan === 'free' ? 'border-border bg-card/50' : 'border-border bg-card/30'}`}>
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-foreground text-sm">Free</p>
                {plan === 'free' && <Badge className="bg-muted text-muted-foreground border-0 text-[9px]">CURRENT</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">{PLAN_LIMITS.free.signupCredits} credits on signup · 1 free analysis</p>
            </div>
            <p className="text-lg font-black text-foreground shrink-0">$0</p>
          </div>

          {/* Pro */}
          <motion.div whileHover={{ scale: 1.005 }}
            className={`rounded-2xl border-2 p-4 flex items-center gap-4 transition-all ${
              plan === 'pro' ? 'border-primary bg-primary/5' : 'border-primary/30 bg-card hover:border-primary/60'
            }`}>
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-primary fill-current" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-foreground text-sm">Pro</p>
                <Badge className="bg-primary text-primary-foreground border-0 text-[9px]">MOST POPULAR</Badge>
                {plan === 'pro' && <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px]">ACTIVE</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                {PLAN_LIMITS.pro.monthlyCredits} credits/month → {Math.floor(PLAN_LIMITS.pro.monthlyCredits / CREDIT_COSTS.analysis)} analyses or {Math.floor(PLAN_LIMITS.pro.monthlyCredits / CREDIT_COSTS.viral)} viral songs
              </p>
            </div>
            <div className="text-right shrink-0 space-y-2">
              <div>
                <p className="text-lg font-black text-foreground">${PLAN_LIMITS.pro.price}</p>
                <p className="text-[10px] text-muted-foreground">/month</p>
              </div>
              {plan !== 'pro'
                ? <Button onClick={() => handleSubscribe('pro', PRICES.pro_monthly)} disabled={loading === 'pro'} size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-xl text-xs h-8 gap-1">
                    {loading === 'pro' ? '…' : <><span>Upgrade</span><ArrowRight className="w-3 h-3" /></>}
                  </Button>
                : <Button onClick={handleManage} size="sm" variant="outline" className="rounded-xl text-xs border-border h-8">Manage</Button>
              }
            </div>
          </motion.div>

          {/* Studio */}
          <motion.div whileHover={{ scale: 1.005 }}
            className={`rounded-2xl border-2 p-4 flex items-center gap-4 transition-all ${
              isStudio ? 'border-accent bg-accent/5' : 'border-accent/30 bg-card hover:border-accent/60'
            }`}>
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-foreground text-sm">Studio</p>
                <Badge className="bg-accent text-black border-0 text-[9px]">BEST VALUE</Badge>
                {isStudio && <Badge className="bg-accent/20 text-accent border-accent/30 text-[9px]">ACTIVE</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                {PLAN_LIMITS.studio.monthlyCredits} credits/month → {Math.floor(PLAN_LIMITS.studio.monthlyCredits / CREDIT_COSTS.analysis)} analyses or {Math.floor(PLAN_LIMITS.studio.monthlyCredits / CREDIT_COSTS.viral)} viral songs
              </p>
            </div>
            <div className="text-right shrink-0 space-y-2">
              <div>
                <p className="text-lg font-black text-foreground">${PLAN_LIMITS.studio.price}</p>
                <p className="text-[10px] text-muted-foreground">/month</p>
              </div>
              {!isStudio
                ? <Button onClick={() => handleSubscribe('studio', PRICES.studio_monthly)} disabled={loading === 'studio'} size="sm"
                    className="bg-gradient-to-r from-accent to-yellow-500 hover:opacity-90 text-black font-bold border-0 rounded-xl text-xs h-8 gap-1">
                    {loading === 'studio' ? '…' : <><span>Upgrade</span><ArrowRight className="w-3 h-3" /></>}
                  </Button>
                : <Button onClick={handleManage} size="sm" variant="outline" className="rounded-xl text-xs border-border h-8">Manage</Button>
              }
            </div>
          </motion.div>
        </div>

        {/* Credit packs */}
        <div className="space-y-3" id="credits">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Buy Credits Once</h2>
              <p className="text-xs text-muted-foreground mt-0.5">No subscription. Credits never expire.</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-xl border border-border/60">
              <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3 text-primary" /> Analyze: <strong className="text-foreground">{CREDIT_COSTS.analysis}cr</strong></span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-accent" /> Viral: <strong className="text-foreground">{CREDIT_COSTS.viral}cr</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CREDIT_PACKS.map((pack, i) => {
              const priceId = i === 0 ? PRICES.credits_100 : i === 1 ? PRICES.credits_300 : PRICES.credits_700;
              return (
                <motion.div key={pack.id} whileHover={{ scale: 1.02, y: -2 }}
                  className={`rounded-2xl border p-5 flex flex-col items-center text-center relative cursor-pointer transition-all ${
                    pack.popular ? 'border-primary bg-primary/8 shadow-lg shadow-primary/10' : 'border-border bg-card hover:border-primary/30'
                  }`}
                  onClick={() => handleBuyCredits(pack.id, priceId)}>
                  {pack.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-black tracking-widest whitespace-nowrap">
                      {pack.badge}
                    </span>
                  )}
                  {pack.savings && !pack.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black tracking-widest whitespace-nowrap">
                      {pack.savings}
                    </span>
                  )}
                  <div className="mt-2 mb-1">
                    <span className="text-4xl font-black text-foreground">{pack.credits.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground ml-1">credits</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3 leading-snug">{pack.desc}</p>
                  <div className="mb-1">
                    <span className="text-2xl font-black text-foreground">${pack.price}</span>
                    <span className="text-xs text-muted-foreground ml-1">one-time</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mb-3">
                    ${(pack.price / pack.credits * 100).toFixed(1)}¢ per credit
                  </p>
                  <Button size="sm" disabled={loading === pack.id}
                    className={`w-full rounded-xl font-bold text-xs h-9 ${
                      pack.popular
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-0'
                        : 'bg-muted/60 text-foreground border border-border hover:bg-primary/10 hover:border-primary/40 hover:text-primary'
                    }`}>
                    {loading === pack.id ? '…' : `Buy ${pack.credits.toLocaleString()} Credits`}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* Low credits nudge */}
          {credits < CREDIT_COSTS.viral && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-accent/8 border border-accent/20">
              <Sparkles className="w-4 h-4 text-accent shrink-0" />
              <p className="text-xs text-foreground/80 flex-1">
                <strong className="text-accent">Running low!</strong> You need {CREDIT_COSTS.viral} credits to create a viral song.
              </p>
              <Button onClick={() => handleBuyCredits('popular', PRICES.credits_300)} size="sm"
                className="shrink-0 bg-accent hover:bg-accent/90 text-black font-bold border-0 rounded-lg text-xs h-8">
                Top up →
              </Button>
            </motion.div>
          )}
        </div>

        {/* Support */}
        <div className="text-center text-xs text-muted-foreground pb-4">
          Questions? <a href="mailto:support@hitcheck.io" className="text-primary hover:underline">support@hitcheck.io</a>
          {' '}·{' '}<Link to="/pricing" className="text-primary hover:underline">Full pricing page →</Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
