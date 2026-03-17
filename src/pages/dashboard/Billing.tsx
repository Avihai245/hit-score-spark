import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PLAN_LIMITS, Plan } from '@/lib/supabase';
import { createCheckoutSession, openCustomerPortal, PRICES } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, Star, Crown, Music, ArrowRight, ExternalLink, CreditCard, Calendar, Coins, X } from 'lucide-react';

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
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
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

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ─── Status Strip ─── */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Current Plan</p>
                <p className="text-base font-bold text-foreground">{PLAN_LIMITS[plan].label}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Status</p>
                <Badge className={`border-0 text-[10px] ${
                  profile?.subscription_status === 'active' ? 'bg-emerald-500/15 text-emerald-400' :
                  profile?.subscription_status === 'past_due' ? 'bg-destructive/15 text-destructive' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {profile?.subscription_status || (plan === 'free' ? 'Free tier' : 'Inactive')}
                </Badge>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Next Billing</p>
                <p className="text-sm font-medium text-foreground">
                  {profile?.plan_expires_at
                    ? new Date(profile.plan_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Coins className="w-3 h-3" /> Credits</p>
                <p className="text-sm font-bold text-foreground">{profile?.credits ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {profile?.stripe_customer_id && (
                <Button onClick={handleManage} size="sm" variant="outline" className="rounded-lg text-xs border-border gap-1.5">
                  <ExternalLink className="w-3 h-3" /> Manage Billing
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Monthly / Yearly Toggle ─── */}
        <div className="flex items-center justify-center gap-1 p-1 bg-muted/50 rounded-xl w-fit mx-auto">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              billing === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              billing === 'yearly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Yearly
            <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[9px] px-1.5">SAVE 20%</Badge>
          </button>
        </div>

        {/* ─── Plan Cards ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Free */}
          <div className={`rounded-2xl border-2 p-6 flex flex-col transition-all ${isActive('free') ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
            <div className="flex items-center gap-2 mb-4">
              <Music className="h-5 w-5 text-muted-foreground" />
              <span className="font-bold text-foreground text-lg">Free</span>
            </div>
            <div className="mb-1">
              <span className="text-4xl font-bold text-foreground">$0</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Forever free, no card needed</p>
            <ul className="space-y-1 flex-1 mb-6">
              <FeatureRow text="1 analysis per month" included />
              <FeatureRow text="Basic viral score" included />
              <FeatureRow text="Genre detection" included />
              <FeatureRow text="AI remixes" included={false} />
              <FeatureRow text="WAV download" included={false} />
              <FeatureRow text="API access" included={false} />
            </ul>
            {isActive('free') ? (
              <Button disabled className="w-full rounded-xl h-11 bg-muted text-muted-foreground border-0 font-semibold">Current Plan</Button>
            ) : (
              <Button variant="outline" className="w-full rounded-xl h-11 border-border font-semibold" onClick={handleManage}>Downgrade</Button>
            )}
          </div>

          {/* Pro */}
          <div className={`rounded-2xl border-2 p-6 flex flex-col relative transition-all ${isActive('pro') ? 'border-primary bg-primary/5' : 'border-primary/40 bg-card'}`}>
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground border-0 text-[11px] px-4 py-1 font-bold">
              MOST POPULAR
            </Badge>
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground text-lg">Pro</span>
            </div>
            <div className="mb-1">
              <span className="text-4xl font-bold text-foreground">${billing === 'yearly' ? '15' : '19'}</span>
              <span className="text-muted-foreground text-sm ml-1">/mo</span>
            </div>
            <p className="text-sm text-emerald-400 font-medium mb-6">
              {billing === 'yearly' ? 'Billed $180/year · Save 20%' : 'Save 51% — Launch price'}
            </p>
            <ul className="space-y-1 flex-1 mb-6">
              <FeatureRow text="Unlimited analyses" included />
              <FeatureRow text="10 AI remixes/month" included />
              <FeatureRow text="Full report + lyrics" included />
              <FeatureRow text="WAV + MP3 download" included />
              <FeatureRow text="Priority processing" included />
              <FeatureRow text="API access" included={false} />
            </ul>
            {isActive('pro') ? (
              <Button onClick={handleManage} className="w-full rounded-xl h-11 bg-primary/20 text-primary border border-primary/30 font-semibold">Manage Plan</Button>
            ) : (
              <Button onClick={() => handleCheckout(PRICES.pro_monthly, 'subscription')} className="w-full rounded-xl h-11 bg-primary hover:bg-primary/90 text-primary-foreground border-0 font-bold">
                Upgrade to Pro <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Studio */}
          <div className={`rounded-2xl border-2 p-6 flex flex-col relative transition-all ${isActive('studio') ? 'border-accent bg-accent/5' : 'border-accent/30 bg-card'}`}>
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground border-0 text-[11px] px-4 py-1 font-bold">
              BEST VALUE
            </Badge>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-5 w-5 text-accent" />
              <span className="font-bold text-foreground text-lg">Studio</span>
            </div>
            <div className="mb-1">
              <span className="text-4xl font-bold text-foreground">${billing === 'yearly' ? '39' : '49'}</span>
              <span className="text-muted-foreground text-sm ml-1">/mo</span>
            </div>
            <p className="text-sm text-accent font-medium mb-6">
              {billing === 'yearly' ? 'Billed $468/year · Save 20%' : 'For teams & labels'}
            </p>
            <ul className="space-y-1 flex-1 mb-6">
              <FeatureRow text="Everything in Pro" included />
              <FeatureRow text="Unlimited remixes" included />
              <FeatureRow text="API access" included />
              <FeatureRow text="Team seats (3)" included />
              <FeatureRow text="Priority support" included />
              <FeatureRow text="Custom branding" included />
            </ul>
            {isActive('studio') ? (
              <Button onClick={handleManage} className="w-full rounded-xl h-11 bg-accent/20 text-accent border border-accent/30 font-semibold">Manage Plan</Button>
            ) : (
              <Button onClick={() => handleCheckout(PRICES.studio_monthly, 'subscription')} className="w-full rounded-xl h-11 bg-accent hover:bg-accent/90 text-accent-foreground border-0 font-bold">
                Go Studio <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* ─── Payment Info ─── */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" /> Payment Information
          </h2>
          {profile?.stripe_customer_id ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">{profile.subscription_status || 'Active'}</Badge>
              </div>
              {profile.plan_expires_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next renewal</span>
                  <span className="text-foreground">{new Date(profile.plan_expires_at).toLocaleDateString()}</span>
                </div>
              )}
              <Button onClick={handleManage} size="sm" variant="outline" className="mt-2 rounded-lg text-xs border-border gap-1.5">
                <ExternalLink className="w-3 h-3" /> Open Billing Portal
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payment method on file. Upgrade to add one.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
