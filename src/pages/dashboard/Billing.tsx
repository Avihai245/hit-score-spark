import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PLAN_LIMITS, CREDIT_COSTS, CREDIT_PACKS, Plan } from '@/lib/supabase';
import { createCheckoutSession, openCustomerPortal, PRICES } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Check, Star, Crown, ArrowRight, ExternalLink, Calendar,
  Coins, X, Zap, Sparkles, Rocket,
} from 'lucide-react';

/* ─── Feature row ─── */
const FeatureRow = ({ text, included }: { text: string; included: boolean }) => (
  <li className="flex items-start gap-2 text-[13px] py-0.5">
    {included ? (
      <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <Check className="h-2.5 w-2.5 text-emerald-400" />
      </div>
    ) : (
      <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <X className="h-2.5 w-2.5 text-muted-foreground/30" />
      </div>
    )}
    <span className={`leading-snug ${included ? 'text-foreground/80' : 'text-muted-foreground/40'}`}>{text}</span>
  </li>
);

export default function DashboardBilling() {
  const { user, profile, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const plan: Plan = (profile?.plan as Plan) || 'free';
  const isActive = (p: Plan) => plan === p;

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      toast.success('Payment successful! Your plan has been updated.');
      refreshProfile();
      window.history.replaceState({}, '', '/dashboard/billing');
    }
  }, [searchParams]);

  const handleCheckout = async (priceId: string, mode: 'subscription' | 'payment' = 'subscription') => {
    if (!user?.id) { toast.error('Please sign in first'); return; }
    toast.loading('Redirecting to checkout...', { id: 'checkout' });
    const result = await createCheckoutSession(priceId, user.id, mode);
    toast.dismiss('checkout');
    if (result === null) toast.error('Checkout unavailable. Please try again later.');
  };

  const handleManage = async () => {
    if (!user?.id) return;
    toast.loading('Opening billing portal...', { id: 'portal' });
    const result = await openCustomerPortal(user.id);
    toast.dismiss('portal');
    if (result === null) toast.error('Billing portal unavailable. Please try again later.');
  };

  const yearlyDiscount = 0.8;

  const plans = [
    {
      id: 'pro' as Plan,
      name: 'Pro',
      icon: Star,
      monthlyPrice: 19,
      badge: 'MOST POPULAR',
      badgeClass: 'bg-primary text-primary-foreground',
      borderClass: 'border-primary/40',
      activeClass: 'border-primary bg-primary/5',
      btnClass: 'bg-primary hover:bg-primary/90 text-primary-foreground',
      description: 'Unlimited analyses + viral song creation',
      features: [
        'Unlimited song analyses',
        'Up to 4 viral songs/month',
        'Smart scan of top 500 live hits',
        'Full viral report + lyrics breakdown',
        'MP3 download',
        'Priority processing',
      ],
    },
    {
      id: 'studio' as Plan,
      name: 'Studio',
      icon: Crown,
      monthlyPrice: 29,
      badge: null,
      badgeClass: '',
      borderClass: 'border-accent/30',
      activeClass: 'border-accent bg-accent/5',
      btnClass: 'bg-accent hover:bg-accent/90 text-accent-foreground',
      description: 'More viral songs for serious creators',
      features: [
        'Everything in Pro',
        'Up to 10 viral songs/month',
        'WAV + MP3 download',
        'Advanced analytics',
        'Commercial use rights',
        'Priority support',
      ],
    },
    {
      id: 'business' as Plan,
      name: 'Business',
      icon: Sparkles,
      monthlyPrice: 49,
      badge: 'BEST VALUE',
      badgeClass: 'bg-emerald-500 text-white',
      borderClass: 'border-emerald-500/30',
      activeClass: 'border-emerald-500 bg-emerald-500/5',
      btnClass: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      description: 'Scale your music production',
      features: [
        'Everything in Studio',
        'Up to 20 viral songs/month',
        'WAV + MP3 + stems download',
        'Full commercial rights',
        'Early access to new features',
        'Priority support',
      ],
    },
    {
      id: 'unlimited' as Plan,
      name: 'Unlimited',
      icon: Rocket,
      monthlyPrice: 79,
      badge: null,
      badgeClass: '',
      borderClass: 'border-amber-500/30',
      activeClass: 'border-amber-500 bg-amber-500/5',
      btnClass: 'bg-amber-500 hover:bg-amber-600 text-white',
      description: 'No limits. Maximum revenue potential.',
      features: [
        'Everything in Business',
        'Unlimited viral songs',
        'Fastest priority queue',
        'Full commercial rights',
        'Early access to new features',
        'Premium support',
      ],
    },
  ];

  const planOrder = ['free', 'pro', 'studio', 'business', 'unlimited'];
  const currentIndex = planOrder.indexOf(plan);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">

        {/* ─── Header ─── */}
        <div className="text-center px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Manage your plan</h1>
          <p className="text-sm text-muted-foreground mt-1">Select the plan that best fits your needs</p>
        </div>

        {/* ─── Status Strip ─── */}
        <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Current Plan</p>
                <Badge className="bg-primary/15 text-primary border-0 text-[10px] sm:text-xs font-bold">
                  {PLAN_LIMITS[plan].label}
                </Badge>
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Billing Period</p>
                <p className="text-xs sm:text-sm font-medium text-foreground">
                  {profile?.subscription_status === 'active' ? 'Month' : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 hidden sm:inline" /> Next Billing
                </p>
                <p className="text-xs sm:text-sm font-medium text-foreground">
                  {profile?.plan_expires_at
                    ? new Date(profile.plan_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
                  <Coins className="w-3 h-3 hidden sm:inline" /> Credits
                </p>
                <p className="text-xs sm:text-sm font-bold text-foreground">{profile?.credits ?? 0}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {profile?.stripe_customer_id && (
                <>
                  <Button onClick={handleManage} size="sm" variant="outline" className="rounded-lg text-[11px] sm:text-xs border-border h-8">
                    Cancel subscription
                  </Button>
                  <Button onClick={handleManage} size="sm" variant="outline" className="rounded-lg text-[11px] sm:text-xs border-border h-8">
                    Update payment
                  </Button>
                </>
              )}
              <Button
                onClick={() => document.getElementById('credits-section')?.scrollIntoView({ behavior: 'smooth' })}
                size="sm"
                className="rounded-lg text-[11px] sm:text-xs bg-primary hover:bg-primary/90 text-primary-foreground border-0 h-8 gap-1"
              >
                <Coins className="w-3 h-3" /> Buy credits
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Support note ─── */}
        <p className="text-center text-[11px] sm:text-xs text-muted-foreground px-4">
          Need help? Email us at{' '}
          <a href="mailto:support@viralize.io" className="text-primary hover:underline">support@viralize.io</a>
        </p>

        {/* ─── Monthly / Yearly Toggle ─── */}
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <button
            onClick={() => setBilling('monthly')}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              billing === 'monthly' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              billing === 'monthly' ? 'border-primary' : 'border-muted-foreground/40'
            }`}>
              {billing === 'monthly' && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              billing === 'yearly' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              billing === 'yearly' ? 'border-primary' : 'border-muted-foreground/40'
            }`}>
              {billing === 'yearly' && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            Yearly
            <Badge className="bg-primary text-primary-foreground border-0 text-[9px] px-2 py-0.5 font-bold">
              SAVE 20%
            </Badge>
          </button>
        </div>

        {/* ─── Plan Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => {
            const price = billing === 'yearly'
              ? Math.round(p.monthlyPrice * yearlyDiscount)
              : p.monthlyPrice;
            const active = isActive(p.id);
            const Icon = p.icon;
            const pIndex = planOrder.indexOf(p.id);
            const isUpgrade = pIndex > currentIndex;

            return (
              <div
                key={p.id}
                className={`rounded-2xl border-2 p-4 sm:p-5 flex flex-col relative transition-all ${
                  active ? p.activeClass : `${p.borderClass} bg-card`
                }`}
              >
                {p.badge && (
                  <Badge className={`${p.badgeClass} border-0 text-[9px] px-2 py-0.5 font-bold absolute -top-2.5 right-3`}>
                    {p.badge}
                  </Badge>
                )}

                {/* Header */}
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="h-4 w-4 text-foreground/70" />
                  <span className="font-bold text-foreground text-base">{p.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{p.description}</p>

                {/* Price */}
                <div className="mb-1">
                  <span className="text-3xl font-bold text-foreground">${price}</span>
                  <span className="text-muted-foreground text-xs ml-1">/mo</span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-4">
                  {billing === 'yearly'
                    ? `Billed $${price * 12}/yr · Save $${(p.monthlyPrice - price) * 12}`
                    : 'Billed monthly'}
                </p>

                {/* Features — grows to fill space */}
                <ul className="space-y-0.5 flex-1 mb-4">
                  {p.features.map((f) => (
                    <FeatureRow key={f} text={f} included />
                  ))}
                </ul>

                {/* CTA — always at bottom */}
                {active ? (
                  <Button
                    onClick={handleManage}
                    className="w-full rounded-xl h-10 bg-muted text-foreground border border-border font-semibold text-sm"
                  >
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleCheckout(PRICES.pro_monthly, 'subscription')}
                    className={`w-full rounded-xl h-10 border-0 font-bold text-sm ${p.btnClass}`}
                  >
                    {isUpgrade ? 'Upgrade' : 'Downgrade'}
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* ─── Pay As You Go Credits ─── */}
        <div id="credits-section" className="pt-4">
          <div className="text-center mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-accent" /> Pay As You Go
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              No subscription needed. Buy credits and use them anytime.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-5">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Song Analysis</span>
              <span className="font-bold text-foreground">= {CREDIT_COSTS.analysis} credits</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-muted-foreground">Viral Song Creation</span>
              <span className="font-bold text-foreground">= {CREDIT_COSTS.viral} credits</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.credits}
                className={`rounded-2xl border-2 p-4 sm:p-5 flex flex-col items-center text-center transition-all ${
                  pack.popular ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                {pack.popular && (
                  <Badge className="bg-primary text-primary-foreground border-0 text-[9px] px-2 mb-2 font-bold">
                    MOST POPULAR
                  </Badge>
                )}
                {!pack.popular && <div className="mb-2 h-5" />}
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{pack.credits}</p>
                <p className="text-[11px] text-muted-foreground mb-1">credits</p>
                <p className="text-lg sm:text-xl font-bold text-foreground mb-1">${pack.price}</p>
                {pack.savings ? (
                  <p className="text-[11px] text-emerald-400 font-medium mb-3">Save {pack.savings}</p>
                ) : (
                  <div className="mb-3 h-4" />
                )}
                <Button
                  onClick={() => handleCheckout(PRICES.analysis_credit, 'payment')}
                  size="sm"
                  className={`w-full rounded-xl h-9 font-semibold text-xs mt-auto ${
                    pack.popular
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-0'
                      : 'bg-muted text-foreground border border-border hover:bg-muted/80'
                  }`}
                >
                  Buy Credits
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Billing Portal Link ─── */}
        {profile?.stripe_customer_id && (
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage your subscription, payment methods, and invoices
              </p>
              <Button onClick={handleManage} size="sm" variant="outline" className="rounded-lg text-xs border-border gap-1.5 shrink-0">
                <ExternalLink className="w-3 h-3" /> Open Billing Portal
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
