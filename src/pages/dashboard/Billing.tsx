import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PLAN_LIMITS, CREDIT_COSTS, CREDIT_PACKS, Plan } from '@/lib/supabase';
import { createCheckoutSession, openCustomerPortal, PRICES } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, Star, Crown, ArrowRight, ExternalLink, Calendar, Coins, X, Zap } from 'lucide-react';

/* ─── Feature row ─── */
const FeatureRow = ({ text, included }: { text: string; included: boolean }) => (
  <li className="flex items-center gap-2.5 text-sm py-1">
    {included ? (
      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
        <Check className="h-3 w-3 text-emerald-400" />
      </div>
    ) : (
      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
        <X className="h-3 w-3 text-muted-foreground/30" />
      </div>
    )}
    <span className={included ? 'text-foreground/80' : 'text-muted-foreground/50'}>{text}</span>
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

  const proPrice = billing === 'yearly' ? 15 : 19;
  const studioPrice = billing === 'yearly' ? 23 : 29;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ─── Header ─── */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Manage your plan</h1>
          <p className="text-muted-foreground mt-1">Select the plan that best fits your needs</p>
        </div>

        {/* ─── Status Strip ─── */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Current Plan</p>
                <Badge className="bg-primary/15 text-primary border-0 text-xs font-bold">{PLAN_LIMITS[plan].label}</Badge>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Billing Period</p>
                <p className="text-sm font-medium text-foreground">
                  {profile?.subscription_status === 'active' ? 'Month' : '—'}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Next Billing Date
                </p>
                <p className="text-sm font-medium text-foreground">
                  {profile?.plan_expires_at
                    ? new Date(profile.plan_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
                  <Coins className="w-3 h-3" /> Credits Remaining
                </p>
                <p className="text-sm font-bold text-foreground">{profile?.credits ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {profile?.stripe_customer_id && (
                <>
                  <Button onClick={handleManage} size="sm" variant="outline" className="rounded-lg text-xs border-border gap-1.5">
                    Cancel subscription
                  </Button>
                  <Button onClick={handleManage} size="sm" variant="outline" className="rounded-lg text-xs border-border gap-1.5">
                    Update payment
                  </Button>
                </>
              )}
              <Button onClick={() => {
                const el = document.getElementById('credits-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }} size="sm" className="rounded-lg text-xs bg-primary hover:bg-primary/90 text-primary-foreground border-0 gap-1.5">
                <Coins className="w-3 h-3" /> Buy more credits
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Support note ─── */}
        <p className="text-center text-xs text-muted-foreground">
          Need help? For support, issues with credits, email us at{' '}
          <a href="mailto:support@viralize.io" className="text-primary hover:underline">support@viralize.io</a>
        </p>

        {/* ─── Monthly / Yearly Toggle ─── */}
        <div className="flex items-center justify-center gap-4">
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

        {/* ─── Plan Cards (2 plans only) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Pro */}
          <div className={`rounded-2xl border-2 p-6 flex flex-col relative transition-all ${
            isActive('pro') ? 'border-primary bg-primary/5' : 'border-primary/40 bg-card'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <span className="font-bold text-foreground text-xl">Pro Plan</span>
              </div>
              <Badge className="bg-primary text-primary-foreground border-0 text-[10px] px-3 py-1 font-bold">
                MOST POPULAR
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Access to all analysis and creation tools.</p>

            <div className="mb-1">
              <span className="text-4xl font-bold text-foreground">${proPrice}</span>
              <span className="text-muted-foreground text-sm ml-1">/month</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              {billing === 'yearly' ? `Saves $${(19 - 15) * 12}/year by billing yearly!` : 'Save 20% with yearly billing'}
              <br />Taxes calculated at checkout
            </p>

            {/* CTA */}
            {isActive('pro') ? (
              <Button onClick={handleManage} className="w-full rounded-xl h-12 bg-muted text-foreground border border-border font-semibold text-base mb-6">
                Downgrade
              </Button>
            ) : (
              <Button onClick={() => handleCheckout(PRICES.pro_monthly, 'subscription')} className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground border-0 font-bold text-base mb-6">
                {plan === 'studio' ? 'Downgrade' : 'Upgrade to Pro'} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}

            <ul className="space-y-1.5 flex-1">
              <FeatureRow text="Unlimited song analyses" included />
              <FeatureRow text="10 AI remix creations/month" included />
              <FeatureRow text="Full viral report + lyrics breakdown" included />
              <FeatureRow text="WAV + MP3 download" included />
              <FeatureRow text="Priority processing" included />
              <FeatureRow text="Commercial use rights" included />
            </ul>
          </div>

          {/* Studio */}
          <div className={`rounded-2xl border-2 p-6 flex flex-col relative transition-all ${
            isActive('studio') ? 'border-accent bg-accent/5' : 'border-accent/30 bg-card'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-accent" />
                <span className="font-bold text-foreground text-xl">Studio Plan</span>
              </div>
              <Badge className="bg-accent text-accent-foreground border-0 text-[10px] px-3 py-1 font-bold">
                BEST VALUE
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Maximum creations and every feature unlocked.</p>

            <div className="mb-1">
              <span className="text-4xl font-bold text-foreground">${studioPrice}</span>
              <span className="text-muted-foreground text-sm ml-1">/month</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              {billing === 'yearly' ? `Saves $${(29 - 23) * 12}/year by billing yearly!` : 'Save 20% with yearly billing'}
              <br />Taxes calculated at checkout
            </p>

            {/* CTA */}
            {isActive('studio') ? (
              <Button onClick={handleManage} className="w-full rounded-xl h-12 bg-muted text-foreground border border-border font-semibold text-base mb-6">
                Change Commitment
              </Button>
            ) : (
              <Button onClick={() => handleCheckout(PRICES.studio_monthly, 'subscription')} className="w-full rounded-xl h-12 bg-accent hover:bg-accent/90 text-accent-foreground border-0 font-bold text-base mb-6">
                Go Studio <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}

            <ul className="space-y-1.5 flex-1">
              <FeatureRow text="Everything in Pro" included />
              <FeatureRow text="Unlimited AI remix creations" included />
              <FeatureRow text="Team seats (3 members)" included />
              <FeatureRow text="Priority support" included />
              <FeatureRow text="Advanced analytics dashboard" included />
              <FeatureRow text="Custom branding on exports" included />
            </ul>
          </div>
        </div>

        {/* ─── Pay As You Go Credits ─── */}
        <div id="credits-section" className="max-w-3xl mx-auto pt-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Coins className="w-6 h-6 text-accent" /> Pay As You Go
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              No subscription needed. Buy credits and use them anytime.
            </p>
          </div>

          {/* Credit costs info */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Song Analysis =</span>
              <span className="font-bold text-foreground">{CREDIT_COSTS.analysis} credits</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-muted-foreground">AI Song Creation =</span>
              <span className="font-bold text-foreground">{CREDIT_COSTS.remix} credits</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.credits}
                className={`rounded-2xl border-2 p-5 text-center transition-all ${
                  pack.popular ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                {pack.popular && (
                  <Badge className="bg-primary text-primary-foreground border-0 text-[9px] px-2 mb-2 font-bold">
                    MOST POPULAR
                  </Badge>
                )}
                <p className="text-3xl font-bold text-foreground">{pack.credits}</p>
                <p className="text-xs text-muted-foreground mb-1">credits</p>
                <p className="text-xl font-bold text-foreground mb-1">${pack.price}</p>
                {pack.savings && (
                  <p className="text-xs text-emerald-400 font-medium mb-3">Save {pack.savings}</p>
                )}
                {!pack.savings && <div className="mb-3" />}
                <Button
                  onClick={() => handleCheckout(PRICES.analysis_credit, 'payment')}
                  size="sm"
                  className={`w-full rounded-xl h-10 font-semibold ${
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

        {/* ─── Billing Info ─── */}
        {profile?.stripe_customer_id && (
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Manage your subscription, payment methods, and invoices
              </div>
              <Button onClick={handleManage} size="sm" variant="outline" className="rounded-lg text-xs border-border gap-1.5">
                <ExternalLink className="w-3 h-3" /> Open Billing Portal
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
