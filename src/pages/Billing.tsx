import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_LIMITS, CREDIT_PACKS, CREDIT_COSTS } from '@/lib/supabase';
import { createCheckoutSession, PRICES } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check, Zap, Star, Crown, ChevronDown, ChevronUp, Sparkles, Music, Shield, Clock,
  BarChart2, Download, Users, Code2, FileText, ArrowRight, CreditCard,
} from 'lucide-react';

/* ─── Types ─── */
type PlanId = 'free' | 'payg' | 'pro' | 'studio';

/* ─── Helpers ─── */
const comingSoon = () => {
  toast.info('💳 Payments launching soon!', {
    description: 'We\'re setting up Stripe. Join the waitlist to get notified.',
  });
};

const handleCheckout = async (priceId: string, userId?: string) => {
  if (!userId) {
    toast.error('Please sign in first');
    return;
  }
  const result = await createCheckoutSession(priceId, userId);
  if (result === null) {
    comingSoon();
  }
};

/* ─── FAQ Data ─── */
const FAQ_ITEMS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, absolutely. You can cancel your subscription at any time from the billing portal. Your plan stays active until the end of the billing period, then reverts to Free. No hidden fees, no questions asked.',
  },
  {
    q: 'What happens to my remixes if I downgrade?',
    a: 'All your previously created remixes remain accessible in your Dashboard. You just won\'t be able to create new ones until you upgrade again or purchase single remix credits.',
  },
  {
    q: 'Is WAV quality really lossless?',
    a: 'Yes! Pro and Studio plans include WAV downloads at 44.1kHz / 16-bit — the exact quality required by Spotify, Apple Music, and all major distributors. FLAC and 24-bit options are coming soon.',
  },
  {
    q: 'What does "API access" mean in Studio?',
    a: 'With Studio you get a personal API key to integrate Santo directly into your workflow, DAW plugins, or custom tools. Rate limits: 500 analyses/day per key.',
  },
  {
    q: 'Do credits roll over?',
    a: 'Pay As You Go credits never expire and roll over indefinitely. Pro remix credits (10/month) reset every billing cycle and do not carry over.',
  },
];

/* ─── Testimonials ─── */
const TESTIMONIALS = [
  {
    stars: 5,
    quote: 'Went from 500 to 50K streams in 3 months. Santo told me exactly what to fix.',
    handle: '@axelbeats',
    role: 'EDM Producer, Berlin',
  },
  {
    stars: 5,
    quote: 'The AI remix feature is unreal. My track got picked up by a Spotify editorial playlist.',
    handle: '@solarwolf_music',
    role: 'Indie Pop Artist, LA',
  },
  {
    stars: 5,
    quote: 'Worth every penny. I upgraded to Studio just for the API — we built it into our label workflow.',
    handle: '@freshwaverecords',
    role: 'A&R Manager',
  },
];

/* ─── Plan features ─── */
const FREE_FEATURES = [
  { text: '1 analysis per month', included: true },
  { text: 'Basic score report', included: true },
  { text: 'Viral potential meter', included: true },
  { text: 'AI remix', included: false },
  { text: 'Lyrics analysis', included: false },
  { text: 'Download WAV', included: false },
];

const PRO_FEATURES = [
  { text: 'Unlimited analyses', included: true },
  { text: '10 AI remixes/month', included: true },
  { text: 'Full viral report + lyrics feedback', included: true },
  { text: 'Spotify playlist strategy', included: true },
  { text: 'Priority processing', included: true },
  { text: 'Download WAV + MP3', included: true },
];

const STUDIO_FEATURES = [
  { text: 'Everything in Pro', included: true },
  { text: 'Unlimited AI remixes', included: true },
  { text: 'API access (500 req/day)', included: true },
  { text: '3 team seats', included: true },
  { text: 'White-label reports', included: true },
  { text: 'Priority support + Slack', included: true },
];

/* ─── FAQ Accordion Item ─── */
const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-sm text-white">{q}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-4" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-4" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Feature Row ─── */
const FeatureRow = ({ text, included }: { text: string; included: boolean }) => (
  <li className="flex items-center gap-3 text-sm">
    {included ? (
      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
        <Check className="h-3 w-3 text-green-400" />
      </div>
    ) : (
      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
        <div className="w-1.5 h-0.5 rounded-full bg-white/20" />
      </div>
    )}
    <span className={included ? 'text-foreground/80' : 'text-muted-foreground/50 line-through'}>{text}</span>
  </li>
);

/* ════════════════════════════════════════════════════════════════ */
/* ─── Billing Page ─── */
const Billing = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const plan: PlanId = (profile?.plan as PlanId) || 'free';

  const isActive = (p: PlanId) => plan === p;

  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-20">
      {/* ─── Hero ─── */}
      <div className="container max-w-5xl mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Current plan badge */}
          {user && (
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold border border-primary/30 bg-primary/10 text-primary mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Current plan: {PLAN_LIMITS[plan].label}
            </div>
          )}
          <h1 className="text-4xl md:text-6xl font-black font-heading tracking-tight text-white mb-4">
            Unlock Your Music's<br />
            <span className="bg-gradient-to-r from-primary via-accent to-yellow-300 bg-clip-text text-transparent">
              Full Potential
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Join 10,000+ artists who went viral with Santo. One analysis could change your career.
          </p>
        </motion.div>

        {/* ─── Pricing Cards ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">

          {/* Free Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`relative rounded-3xl border p-7 flex flex-col ${
              isActive('free')
                ? 'border-white/30 bg-white/[0.04]'
                : 'border-white/10 bg-white/[0.02]'
            }`}
          >
            {isActive('free') && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/20 text-white border-0 text-xs px-3 py-1">
                Current Plan
              </Badge>
            )}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Music className="h-5 w-5 text-muted-foreground" />
                <span className="font-bold text-white">Free</span>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-black text-white">$0</span>
                <span className="text-muted-foreground mb-2">/month</span>
              </div>
              <p className="text-xs text-muted-foreground">Forever free. No credit card needed.</p>
            </div>
            <ul className="space-y-3 flex-1 mb-6">
              {FREE_FEATURES.map((f) => <FeatureRow key={f.text} {...f} />)}
            </ul>
            {isActive('free') ? (
              <Button
                disabled
                className="w-full rounded-xl bg-white/10 text-white/50 cursor-not-allowed border-0"
              >
                Current Plan
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                className="w-full rounded-xl border-white/20 hover:bg-white/5 text-white"
              >
                <Link to="/analyze">Get Started Free</Link>
              </Button>
            )}
          </motion.div>

          {/* Pro Card — MOST POPULAR */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`relative rounded-3xl border-2 p-7 flex flex-col scale-[1.03] shadow-2xl shadow-primary/20 ${
              isActive('pro')
                ? 'border-primary bg-primary/15'
                : 'border-primary/70 bg-gradient-to-b from-primary/10 to-transparent'
            }`}
          >
            <Badge className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white border-0 text-xs px-4 py-1.5 font-bold uppercase tracking-wide">
              {isActive('pro') ? 'Current Plan' : 'Most Popular'}
            </Badge>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 text-primary" />
                <span className="font-bold text-white">Pro</span>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-black text-white">$29</span>
                <div className="mb-2">
                  <span className="text-muted-foreground line-through text-sm">$39</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </div>
              <p className="text-xs text-green-400 font-semibold">Save 51% — Launch price</p>
            </div>
            <ul className="space-y-3 flex-1 mb-6">
              {PRO_FEATURES.map((f) => <FeatureRow key={f.text} {...f} />)}
            </ul>
            {isActive('pro') ? (
              <Button
                onClick={() => comingSoon()}
                className="w-full rounded-xl bg-primary/30 text-primary border border-primary/30"
              >
                Manage Subscription
              </Button>
            ) : (
              <div className="space-y-2">
                <motion.button
                  onClick={() => handleCheckout(PRICES.pro_monthly, user?.id)}
                  className="relative w-full py-3.5 rounded-xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-black text-base overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                  />
                  <span className="relative flex items-center justify-center gap-2">
                    <Zap className="h-5 w-5" />
                    Upgrade to Pro →
                  </span>
                </motion.button>
                <p className="text-center text-xs text-muted-foreground">Cancel anytime. No lock-in.</p>
              </div>
            )}
          </motion.div>

          {/* Studio Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`relative rounded-3xl border-2 p-7 flex flex-col ${
              isActive('studio')
                ? 'border-yellow-500/70 bg-yellow-500/10'
                : 'border-yellow-500/30 bg-gradient-to-b from-yellow-500/[0.06] to-transparent'
            }`}
          >
            {isActive('studio') && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black border-0 text-xs px-3 py-1 font-bold">
                Current Plan
              </Badge>
            )}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-5 w-5 text-yellow-400" />
                <span className="font-bold text-white">Studio</span>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-black text-white">$49</span>
                <span className="text-muted-foreground mb-2">/month</span>
              </div>
              <p className="text-xs text-yellow-400 font-semibold">For pros, labels & teams</p>
            </div>
            <ul className="space-y-3 flex-1 mb-6">
              {STUDIO_FEATURES.map((f) => <FeatureRow key={f.text} {...f} />)}
            </ul>
            {isActive('studio') ? (
              <Button
                onClick={() => comingSoon()}
                className="w-full rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              >
                Manage Subscription
              </Button>
            ) : (
              <motion.button
                onClick={() => handleCheckout(PRICES.studio_monthly, user?.id)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-black text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Go Studio →
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* ─── Buy Credits Once ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 mb-16"
        >
          <div className="text-center mb-4">
            <p className="text-xs font-black text-white/30 uppercase tracking-[0.2em] mb-2">No subscription needed</p>
            <h2 className="text-2xl font-black text-white">Buy Credits Once</h2>
            <p className="text-muted-foreground text-sm mt-1">Credits never expire. Top up anytime.</p>
          </div>
          <div className="flex items-center justify-center gap-6 mb-8 text-sm">
            <span className="flex items-center gap-1.5 text-white/50">
              <BarChart2 className="w-4 h-4 text-primary" />
              Analyze: <strong className="text-white">{CREDIT_COSTS.analysis} credits</strong>
            </span>
            <span className="w-px h-4 bg-white/10" />
            <span className="flex items-center gap-1.5 text-white/50">
              <Zap className="w-4 h-4 text-accent" />
              Create Viral: <strong className="text-white">{CREDIT_COSTS.viral} credits</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {CREDIT_PACKS.map((pack, i) => {
              const priceId = i === 0 ? PRICES.credits_100 : i === 1 ? PRICES.credits_300 : PRICES.credits_700;
              return (
                <motion.div
                  key={pack.id}
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCheckout(priceId, user?.id)}
                  className={`relative rounded-2xl border p-6 flex flex-col items-center text-center cursor-pointer transition-all ${
                    pack.popular
                      ? 'border-primary/60 bg-primary/[0.07] shadow-xl shadow-primary/15'
                      : 'border-white/10 bg-white/[0.03] hover:border-primary/30'
                  }`}
                >
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
                  <div className="mt-2">
                    <span className="text-4xl font-black text-white">{pack.credits.toLocaleString()}</span>
                    <span className="text-sm text-white/40 ml-1">credits</span>
                  </div>
                  <p className="text-[11px] text-white/40 mt-1.5 mb-4 leading-snug">{pack.desc}</p>
                  <span className="text-3xl font-black text-white">${pack.price}</span>
                  <p className="text-[10px] text-white/30 mt-0.5 mb-4">
                    ${(pack.price / pack.credits * 100).toFixed(1)}¢ per credit · one-time
                  </p>
                  <motion.button
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                      pack.popular
                        ? 'bg-gradient-to-r from-primary to-violet-500 text-white shadow-lg shadow-primary/25 hover:opacity-90'
                        : 'bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    Buy {pack.credits.toLocaleString()} Credits
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ─── Current Subscription (for paid users) ─── */}
        {user && plan !== 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            
            className="rounded-3xl border border-primary/30 bg-primary/5 p-8 mb-16"
          >
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Your Subscription
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Plan</p>
                <p className="font-bold text-white capitalize">{PLAN_LIMITS[plan].label}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Analyses this month</p>
                <p className="font-bold text-white">
                  {profile?.analyses_used ?? 0} / {PLAN_LIMITS[plan].analyses === 999 ? '∞' : PLAN_LIMITS[plan].analyses}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Remixes this month</p>
                <p className="font-bold text-white">
                  {profile?.remixes_this_month ?? 0} / {PLAN_LIMITS[plan].remixes === 999 ? '∞' : PLAN_LIMITS[plan].remixes === 0 ? 'N/A' : PLAN_LIMITS[plan].remixes}
                </p>
              </div>
            </div>
            <Button
              onClick={() => comingSoon()}
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/10 rounded-xl gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Manage Subscription → Stripe Portal
            </Button>
          </motion.div>
        )}

        {/* ─── Feature comparison ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          
          className="mb-16"
        >
          <h2 className="text-2xl font-black text-white text-center mb-8">Everything you get</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: BarChart2, label: 'Viral Score', desc: 'AI-powered 0–100 rating' },
              { icon: Music, label: 'AI Remix', desc: 'AI-powered enhancement' },
              { icon: Download, label: 'WAV Download', desc: 'Lossless for distribution' },
              { icon: Shield, label: 'Lyrics AI', desc: 'Fix + viral line detection' },
              { icon: Star, label: 'Playlist Match', desc: 'Curator targeting' },
              { icon: Clock, label: 'Priority Queue', desc: 'Skip the wait' },
              { icon: Users, label: 'Team Seats', desc: '3 users in Studio' },
              { icon: Code2, label: 'API Access', desc: 'Studio plan only' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center">
                <item.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Social Proof ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          
          className="mb-16"
        >
          <h2 className="text-2xl font-black text-white text-center mb-8">What artists are saying</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <p className="font-bold text-white text-sm">{t.handle}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ─── FAQ ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          
          className="mb-16"
        >
          <h2 className="text-2xl font-black text-white text-center mb-8">Frequently asked questions</h2>
          <div className="max-w-2xl mx-auto space-y-3">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} {...item} />
            ))}
          </div>
        </motion.div>

        {/* ─── Final CTA ─── */}
        {plan === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            
            className="text-center"
          >
            <div className="rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent p-12">
              <h2 className="text-3xl font-black text-white mb-3">Ready to go viral?</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                One analysis. One change. From 500 streams to 500K.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  onClick={() => handleCheckout(PRICES.pro_monthly, user?.id)}
                  className="relative px-10 py-4 rounded-xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-black text-base overflow-hidden"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                  />
                  <span className="relative flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Upgrade to Pro — $29/month
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </motion.button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 hover:bg-white/5 text-white rounded-xl px-8 py-4 h-auto"
                >
                  <Link to="/analyze">Try Free First</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">Cancel anytime · No credit card needed for free tier</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Billing;
