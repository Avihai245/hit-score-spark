/**
 * Pricing page — matches the screenshot design exactly
 * Dark bg | 3 cards: Free / Pro (MOST POPULAR, orange) / Studio
 * Current plan badge | strikethrough pricing | feature lists
 */
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createCheckoutSession, openCustomerPortal, PRICES } from '@/lib/stripe';
import { toast } from 'sonner';
import { Check, X, Zap, Star, Crown, ArrowRight } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    icon: '🎵',
    price: 0,
    originalPrice: null,
    period: '/month',
    tagline: 'Forever free. No credit card needed.',
    badge: null,
    ctaLabel: 'Get Started Free',
    ctaClass: 'bg-white/10 hover:bg-white/15 text-white border border-white/20',
    borderClass: 'border-white/10',
    bgClass: 'bg-white/[0.03]',
    features: [
      { label: '100 credits on signup (2 scans)', included: true },
      { label: 'Basic score report', included: true },
      { label: 'Viral potential meter', included: true },
      { label: 'Algorithm Hit creation', included: false },
      { label: 'Lyrics analysis', included: false },
      { label: 'Download WAV', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: '⭐',
    price: 19,
    originalPrice: 29,
    period: '/month',
    tagline: '12 songs analyzed + 4 Algorithm Hits per month — less than a coffee per hit',
    badge: 'MOST POPULAR',
    badgeColor: 'bg-primary text-primary-foreground',
    ctaLabel: '⚡ Upgrade to Pro →',
    ctaClass: 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 hover:opacity-90 text-black font-black shadow-lg shadow-amber-500/20',
    borderClass: 'border-primary/60',
    bgClass: 'bg-primary/[0.06]',
    highlight: true,
    features: [
      { label: '600 credits/mo (12 scans or 4 Algorithm Hits)', included: true },
      { label: 'Unlimited analyses', included: true },
      { label: 'Full Algorithm Hit creation', included: true },
      { label: 'Full report + lyrics feedback', included: true },
      { label: 'Priority processing', included: true },
      { label: 'Download WAV + MP3', included: true },
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    icon: '👑',
    price: 39,
    originalPrice: 49,
    period: '/month',
    tagline: 'For pros, labels & teams',
    badge: 'BEST VALUE',
    ctaLabel: 'Get Studio',
    ctaClass: 'bg-gradient-to-r from-amber-600 to-amber-500 hover:opacity-90 text-white font-bold',
    borderClass: 'border-amber-500/40',
    bgClass: 'bg-amber-500/[0.04]',
    features: [
      { label: '1,800 credits/mo (36 scans or 12 Algorithm Hits)', included: true },
      { label: 'Everything in Pro', included: true },
      { label: 'Unlimited Algorithm Hits', included: true },
      { label: 'WAV + MP3 download', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Priority support', included: true },
    ],
  },
];

export default function Pricing() {
  const { user, profile } = useAuth();
  const currentPlan = profile?.plan || 'free';

  const handleCheckout = async (planId: string) => {
    if (!user?.id) {
      toast.error('Sign in to upgrade');
      return;
    }
    const priceId = planId === 'pro' ? PRICES.pro_monthly : PRICES.studio_monthly;
    toast.loading('Redirecting to checkout…', { id: 'checkout' });
    const result = await createCheckoutSession(priceId, user.id, 'subscription');
    toast.dismiss('checkout');
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
    <div className="min-h-screen bg-[#0a0a0a] px-4 pt-32 pb-20">
      <div className="max-w-5xl mx-auto">

        {/* Current plan badge */}
        {user && currentPlan !== 'free' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-sm font-semibold text-primary">
              <Star className="w-4 h-4 fill-current" />
              Current plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </div>
          </motion.div>
        )}

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14 space-y-4">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Unlock Your Music's
            <br />
            <span className="bg-gradient-to-r from-primary via-purple-400 to-amber-400 bg-clip-text text-transparent">
              Full Potential
            </span>
          </h1>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            Join 10,000+ artists who went viral with Santo. One analysis could change your career.
          </p>
        </motion.div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {plans.map((plan, i) => {
            const isCurrent = currentPlan === plan.id || 
              (plan.id === 'studio' && ['studio','business','unlimited'].includes(currentPlan));
            const isActive = plan.highlight;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`relative rounded-2xl border p-6 flex flex-col ${plan.bgClass} ${plan.borderClass} ${
                  isActive ? 'md:scale-[1.03] md:-mt-2 md:mb-2' : ''
                }`}
              >
                {/* Most popular badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black tracking-widest ${plan.badgeColor} shadow-lg whitespace-nowrap`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrent && (
                  <div className="absolute -top-3.5 right-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-amber-500 text-black whitespace-nowrap">
                      Current Plan
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-2.5 mb-4 mt-1">
                  <span className="text-xl">{plan.icon}</span>
                  <span className="text-xl font-bold text-white">{plan.name}</span>
                </div>

                {/* Price */}
                <div className="mb-1.5">
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black text-white">${plan.price}</span>
                    <span className="text-white/40 text-sm pb-1.5">{plan.period}</span>
                    {plan.originalPrice && (
                      <span className="text-white/30 text-sm pb-1.5 line-through">${plan.originalPrice}/mo</span>
                    )}
                  </div>
                  <p className={`text-sm font-medium mt-0.5 ${
                    plan.id === 'pro' ? 'text-amber-400' : 'text-white/40'
                  }`}>{plan.tagline}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 my-5">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2.5">
                      {f.included ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                          <X className="w-3 h-3 text-white/20" />
                        </div>
                      )}
                      <span className={`text-sm ${f.included ? 'text-white/80' : 'text-white/25 line-through'}`}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.id === 'free' ? (
                  <Link to={user ? '/analyze' : '/analyze'}
                    className={`w-full py-3 rounded-xl font-semibold text-sm text-center transition-all ${plan.ctaClass}`}>
                    {isCurrent ? 'Your Current Plan' : plan.ctaLabel}
                  </Link>
                ) : isCurrent ? (
                  <button onClick={handleManage}
                    className="w-full py-3 rounded-xl font-semibold text-sm bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/15 transition-all">
                    Manage Subscription
                  </button>
                ) : (
                  <button onClick={() => handleCheckout(plan.id)}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${plan.ctaClass}`}>
                    {plan.ctaLabel}
                  </button>
                )}

                {plan.id === 'pro' && !isCurrent && (
                  <p className="text-[10px] text-center text-white/30 mt-2">Cancel anytime. No lock-in.</p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* One-time credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 space-y-6"
        >
          <div className="text-center">
            <p className="text-sm font-bold text-white/40 uppercase tracking-widest">Or top up anytime</p>
            <h2 className="text-2xl font-black text-white mt-2">Buy Credits Once</h2>
            <p className="text-white/40 text-sm mt-1">Never expire. No subscription needed.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { credits: 100, price: 12, priceId: PRICES.credits_100, popular: false },
              { credits: 250, price: 25, priceId: PRICES.credits_300, popular: true  },
              { credits: 600, price: 49, priceId: PRICES.credits_700, popular: false },
            ].map(pack => (
              <div key={pack.credits}
                className={`rounded-2xl border p-5 flex flex-col items-center text-center relative ${
                  pack.popular ? 'border-primary/50 bg-primary/[0.06]' : 'border-white/10 bg-white/[0.03]'
                }`}>
                {pack.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-black tracking-widest whitespace-nowrap">
                    BEST VALUE
                  </span>
                )}
                <p className="text-3xl font-black text-white mt-1">{pack.credits.toLocaleString()}</p>
                <p className="text-[11px] text-white/40 mb-2">credits</p>
                <p className="text-2xl font-black text-white">${pack.price}</p>
                <p className="text-[10px] text-white/40 mb-4">one-time</p>
                <button
                  onClick={async () => {
                    if (!user?.id) { toast.error('Sign in first'); return; }
                    toast.loading('Redirecting…', { id: 'checkout' });
                    const result = await createCheckoutSession(pack.priceId, user.id, 'payment');
                    toast.dismiss('checkout');
                    if (result === null) toast.error('Checkout unavailable.');
                  }}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    pack.popular
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : 'bg-white/10 hover:bg-white/15 text-white'
                  }`}>
                  Buy Credits
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-16 space-y-3"
        >
          <p className="text-white/40 text-sm">
            Already a member?{' '}
            <Link to="/dashboard/billing" className="text-primary hover:underline font-semibold">
              Manage your plan →
            </Link>
          </p>
          <p className="text-white/20 text-xs">
            Questions? Email{' '}
            <a href="mailto:support@santo.fm" className="text-white/40 hover:text-white">support@santo.fm</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
