/**
 * Pricing — Suno-style subscription model
 * Free: 50cr (1 analysis) | Pro $29/mo 500cr | Studio $49/mo 1000cr
 * + One-time credit packs (more expensive per credit = incentivize subscription)
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createCheckoutSession, openCustomerPortal, PRICES } from '@/lib/stripe';
import { CREDIT_COSTS, PLAN_LIMITS, CREDIT_PACKS } from '@/lib/supabase';
import { toast } from 'sonner';
import { Check, Zap, Star, Crown, Sparkles, Music2, BarChart2, ArrowRight, Info } from 'lucide-react';

export default function Pricing() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const currentPlan = profile?.plan || 'free';
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (id: string, priceId: string, mode: 'subscription' | 'payment' = 'subscription') => {
    if (!user?.id) { toast.error('Sign in to continue'); navigate('/auth'); return; }
    setLoading(id);
    toast.loading('Redirecting to checkout…', { id: 'checkout' });
    const result = await createCheckoutSession(priceId, user.id, mode);
    toast.dismiss('checkout');
    setLoading(null);
    if (result === null) toast.error('Checkout unavailable. Please try again.');
  };

  const handleManage = async () => {
    if (!user?.id) return;
    toast.loading('Opening billing portal…', { id: 'portal' });
    const result = await openCustomerPortal(user.id);
    toast.dismiss('portal');
    if (result === null) toast.error('Billing portal unavailable.');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pt-28 pb-24">
      <div className="max-w-5xl mx-auto space-y-16">

        {/* Header */}
        <div className="text-center space-y-4">
          {user && currentPlan !== 'free' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mb-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-sm font-semibold text-primary">
                <Star className="w-4 h-4 fill-current" />
                Current plan: {PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS]?.label || currentPlan}
              </div>
            </motion.div>
          )}
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-white leading-tight">
            Unlock Your Music's Full Potential
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
            className="text-white/40 text-lg max-w-xl mx-auto">
            Analyze, create, and go viral — powered by AI trained on millions of hits
          </motion.p>
          {/* Credit cost legend */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
            className="inline-flex items-center gap-5 px-5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-sm">
            <span className="flex items-center gap-1.5 text-white/60">
              <BarChart2 className="w-4 h-4 text-primary" />
              Analyze: <strong className="text-white">{CREDIT_COSTS.analysis} credits</strong>
            </span>
            <span className="w-px h-4 bg-white/10" />
            <span className="flex items-center gap-1.5 text-white/60">
              <Sparkles className="w-4 h-4 text-orange-400" />
              Create Viral: <strong className="text-white">{CREDIT_COSTS.viral} credits</strong>
            </span>
          </motion.div>
        </div>

        {/* ── Subscription Plans ── */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* Free */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-3xl border border-white/10 bg-white/[0.02] p-7 flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <Music2 className="w-5 h-5 text-white/50" />
              </div>
              <div>
                <p className="font-black text-white text-lg">Free</p>
                <p className="text-[11px] text-white/40">No credit card needed</p>
              </div>
            </div>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-black text-white">$0</span>
              <span className="text-white/40 text-sm mb-2">/month</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold mb-5 bg-white/8 text-white/50 w-fit">
              <Zap className="w-3 h-3" />{PLAN_LIMITS.free.signupCredits} credits on signup (one-time)
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {[
                { t: `${PLAN_LIMITS.free.signupCredits} free credits`, s: '1 full analysis included', ok: true },
                { t: 'Basic score report', ok: true },
                { t: 'Viral potential meter', ok: true },
                { t: 'Create viral songs', ok: false },
                { t: 'Monthly credit refresh', ok: false },
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${f.ok ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                    {f.ok ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <span className="w-1.5 h-px bg-white/20 block" />}
                  </div>
                  <div>
                    <span className={`text-sm ${f.ok ? 'text-white/80' : 'text-white/25 line-through'}`}>{f.t}</span>
                    {'s' in f && <span className="text-[10px] text-white/30 ml-1">({f.s})</span>}
                  </div>
                </li>
              ))}
            </ul>
            {currentPlan === 'free' && user
              ? <Link to="/dashboard" className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all">Go to Dashboard</Link>
              : <Link to="/auth" className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all">Get Started Free</Link>
            }
          </motion.div>

          {/* Pro */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}
            className="rounded-3xl border-2 border-primary/60 bg-primary/[0.05] p-7 flex flex-col relative md:-mt-4 md:mb-4 shadow-2xl shadow-primary/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black text-white bg-primary tracking-widest">
              MOST POPULAR
            </div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary fill-current" />
              </div>
              <div>
                <p className="font-black text-white text-lg">Pro</p>
                <p className="text-[11px] text-white/40">For serious artists</p>
              </div>
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-5xl font-black text-white">${PLAN_LIMITS.pro.price}</span>
              <span className="text-white/40 text-sm mb-2">/month</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold mb-5 bg-primary/15 text-primary w-fit">
              <Zap className="w-3 h-3" />{PLAN_LIMITS.pro.monthlyCredits} credits / month
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {[
                { t: `${PLAN_LIMITS.pro.monthlyCredits} credits every month`, s: 'auto-refresh', ok: true },
                { t: `${Math.floor(PLAN_LIMITS.pro.monthlyCredits / CREDIT_COSTS.analysis)} analyses/month`, s: `${CREDIT_COSTS.analysis}cr each`, ok: true },
                { t: `${Math.floor(PLAN_LIMITS.pro.monthlyCredits / CREDIT_COSTS.viral)} viral songs/month`, s: `${CREDIT_COSTS.viral}cr each`, ok: true },
                { t: 'Full viral report + lyrics feedback', ok: true },
                { t: 'Spotify playlist strategy', ok: true },
                { t: 'Download WAV + MP3', ok: true },
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-emerald-500/20">
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-sm text-white/80">{f.t}</span>
                    {'s' in f && <span className="text-[10px] text-white/30 ml-1">({f.s})</span>}
                  </div>
                </li>
              ))}
            </ul>
            {currentPlan === 'pro'
              ? <button onClick={handleManage} className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-all">Manage Subscription</button>
              : <button onClick={() => handleCheckout('pro', PRICES.pro_monthly)} disabled={loading === 'pro'}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:opacity-90 transition-all disabled:opacity-60">
                  {loading === 'pro' ? 'Processing…' : <><Zap className="w-4 h-4" />Upgrade to Pro <ArrowRight className="w-4 h-4" /></>}
                </button>
            }
          </motion.div>

          {/* Studio */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
            className="rounded-3xl border-2 border-amber-500/40 bg-amber-500/[0.04] p-7 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black text-white bg-amber-500 tracking-widest">
              BEST VALUE
            </div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="font-black text-white text-lg">Studio</p>
                <p className="text-[11px] text-white/40">For pros, labels & teams</p>
              </div>
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-5xl font-black text-white">${PLAN_LIMITS.studio.price}</span>
              <span className="text-white/40 text-sm mb-2">/month</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold mb-5 bg-amber-500/15 text-amber-400 w-fit">
              <Zap className="w-3 h-3" />{PLAN_LIMITS.studio.monthlyCredits} credits / month
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {[
                { t: `${PLAN_LIMITS.studio.monthlyCredits} credits every month`, s: 'auto-refresh', ok: true },
                { t: `${Math.floor(PLAN_LIMITS.studio.monthlyCredits / CREDIT_COSTS.analysis)} analyses/month`, s: `${CREDIT_COSTS.analysis}cr each`, ok: true },
                { t: `${Math.floor(PLAN_LIMITS.studio.monthlyCredits / CREDIT_COSTS.viral)} viral songs/month`, s: `${CREDIT_COSTS.viral}cr each`, ok: true },
                { t: 'Everything in Pro', ok: true },
                { t: 'API access (500 req/day)', ok: true },
                { t: '3 team seats', ok: true },
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-emerald-500/20">
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-sm text-white/80">{f.t}</span>
                    {'s' in f && <span className="text-[10px] text-white/30 ml-1">({f.s})</span>}
                  </div>
                </li>
              ))}
            </ul>
            {currentPlan === 'studio' || currentPlan === 'business' || currentPlan === 'unlimited'
              ? <button onClick={handleManage} className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-all">Manage Subscription</button>
              : <button onClick={() => handleCheckout('studio', PRICES.studio_monthly)} disabled={loading === 'studio'}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-400 text-white font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-60">
                  {loading === 'studio' ? 'Processing…' : <>Get Studio <ArrowRight className="w-4 h-4" /></>}
                </button>
            }
          </motion.div>
        </div>

        {/* ── One-time Credit Packs ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <div className="text-center mb-4">
            <p className="text-xs font-black text-white/30 uppercase tracking-[0.2em] mb-2">No subscription needed</p>
            <h2 className="text-2xl font-black text-white">Buy Credits Once</h2>
            <p className="text-white/40 text-sm mt-1">Credits never expire. Less value per credit than a subscription.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            {CREDIT_PACKS.map((pack, i) => {
              const priceId = i === 0 ? PRICES.credits_100 : i === 1 ? PRICES.credits_500 : PRICES.credits_1000;
              return (
                <motion.div key={pack.id} whileHover={{ scale: 1.03, y: -3 }} whileTap={{ scale: 0.98 }}
                  onClick={() => handleCheckout(pack.id, priceId, 'payment')}
                  className={`relative rounded-2xl border p-6 flex flex-col items-center text-center cursor-pointer transition-all ${
                    pack.popular ? 'border-primary/50 bg-primary/[0.07] shadow-xl shadow-primary/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                  }`}>
                  {pack.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-white text-[9px] font-black tracking-widest whitespace-nowrap">
                      {pack.badge}
                    </span>
                  )}
                  {pack.savings && !pack.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black tracking-widest whitespace-nowrap">
                      {pack.savings}
                    </span>
                  )}
                  <div className="mt-3">
                    <span className="text-4xl font-black text-white">{pack.credits.toLocaleString()}</span>
                    <span className="text-sm text-white/40 ml-1">credits</span>
                  </div>
                  <p className="text-[11px] text-white/40 mt-1.5 mb-4 leading-snug">{pack.desc}</p>
                  <span className="text-3xl font-black text-white">${pack.price}</span>
                  <p className="text-[10px] text-white/30 mt-0.5 mb-4">one-time · never expires</p>
                  <button disabled={loading === pack.id}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                      pack.popular
                        ? 'bg-gradient-to-r from-primary to-violet-500 text-white hover:opacity-90'
                        : 'bg-white/10 text-white hover:bg-white/15'
                    }`}>
                    {loading === pack.id ? 'Processing…' : `Buy ${pack.credits} Credits`}
                  </button>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-6 flex items-start gap-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
            <Info className="w-4 h-4 text-white/30 shrink-0 mt-0.5" />
            <p className="text-xs text-white/40 leading-relaxed">
              <strong className="text-white/60">Subscription is better value:</strong>{' '}
              Pro gives you {PLAN_LIMITS.pro.monthlyCredits} credits for ${PLAN_LIMITS.pro.price}/mo
              ({(PLAN_LIMITS.pro.price / PLAN_LIMITS.pro.monthlyCredits * 100).toFixed(1)}¢/credit).
              One-time packs cost more per credit — perfect if you just want to top up occasionally.
            </p>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="grid sm:grid-cols-2 gap-4 text-sm">
          {[
            { q: 'Do monthly credits roll over?', a: 'No — subscription credits refresh at the start of each billing cycle. Purchased credit packs never expire.' },
            { q: 'Can I cancel anytime?', a: 'Yes — cancel anytime from your billing portal. Access continues until the end of the billing period.' },
            { q: 'What if I run out of credits?', a: 'Buy a one-time credit pack anytime without changing your subscription.' },
            { q: 'Is there a free trial?', a: `Yes — sign up free and get ${PLAN_LIMITS.free.signupCredits} credits instantly. Enough for 1 full analysis. No card needed.` },
          ].map((faq, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <p className="font-bold text-white/80 mb-1">{faq.q}</p>
              <p className="text-white/40 text-xs leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
