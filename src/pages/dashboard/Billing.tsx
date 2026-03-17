import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PLAN_LIMITS, Plan } from '@/lib/supabase';
import { createCheckoutSession, PRICES } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, Star, Crown, Zap, Music, CreditCard, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const comingSoon = () => toast.info('Payments launching soon!');

const handleCheckout = async (priceId: string, userId?: string) => {
  if (!userId) { toast.error('Please sign in first'); return; }
  const result = await createCheckoutSession(priceId, userId);
  if (result === null) comingSoon();
};

const FeatureRow = ({ text, included }: { text: string; included: boolean }) => (
  <li className="flex items-center gap-2 text-sm">
    {included ? (
      <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center"><Check className="h-2.5 w-2.5 text-emerald-400" /></div>
    ) : (
      <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center"><div className="w-1 h-0.5 bg-muted-foreground/30 rounded" /></div>
    )}
    <span className={included ? 'text-foreground/80' : 'text-muted-foreground/50 line-through'}>{text}</span>
  </li>
);

export default function DashboardBilling() {
  const { user, profile } = useAuth();
  const plan: Plan = (profile?.plan as Plan) || 'free';
  const isActive = (p: Plan) => plan === p;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing & Subscription</h1>
          <p className="text-sm text-muted-foreground">
            Current plan: <Badge className="bg-primary/10 text-primary border-0 text-[10px] uppercase ml-1">{PLAN_LIMITS[plan].label}</Badge>
          </p>
        </div>

        {/* Current plan summary */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Plan</p>
              <p className="text-xl font-bold text-foreground">{PLAN_LIMITS[plan].label}</p>
            </div>
            {profile?.subscription_status && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">
                {profile.subscription_status}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Analyses</p>
              <p className="text-lg font-bold">{profile?.analyses_used || 0} / {PLAN_LIMITS[plan].analyses === 999 ? '∞' : PLAN_LIMITS[plan].analyses}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Remixes</p>
              <p className="text-lg font-bold">{profile?.remixes_this_month || 0} / {PLAN_LIMITS[plan].remixes === 999 ? '∞' : PLAN_LIMITS[plan].remixes}</p>
            </div>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free */}
          <div className={`rounded-xl border p-5 flex flex-col ${isActive('free') ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
            <div className="flex items-center gap-2 mb-3"><Music className="h-4 w-4 text-muted-foreground" /><span className="font-semibold text-foreground">Free</span></div>
            <p className="text-3xl font-bold text-foreground mb-1">$0</p>
            <p className="text-xs text-muted-foreground mb-4">Forever free</p>
            <ul className="space-y-2 flex-1 mb-4">
              <FeatureRow text="1 analysis/month" included />
              <FeatureRow text="Basic score" included />
              <FeatureRow text="AI remixes" included={false} />
              <FeatureRow text="WAV download" included={false} />
            </ul>
            {isActive('free') ? (
              <Button disabled className="w-full rounded-lg bg-muted text-muted-foreground border-0">Current</Button>
            ) : (
              <Button variant="outline" className="w-full rounded-lg border-border">Downgrade</Button>
            )}
          </div>

          {/* Pro */}
          <div className={`rounded-xl border-2 p-5 flex flex-col relative ${isActive('pro') ? 'border-primary bg-primary/5' : 'border-primary/50 bg-card'}`}>
            <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground border-0 text-[10px] px-3">
              {isActive('pro') ? 'Current' : 'Popular'}
            </Badge>
            <div className="flex items-center gap-2 mb-3"><Star className="h-4 w-4 text-primary" /><span className="font-semibold text-foreground">Pro</span></div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-3xl font-bold text-foreground">$19</span>
              <span className="text-muted-foreground text-sm mb-1">/mo</span>
            </div>
            <p className="text-xs text-emerald-400 font-medium mb-4">Save 51% — Launch price</p>
            <ul className="space-y-2 flex-1 mb-4">
              <FeatureRow text="Unlimited analyses" included />
              <FeatureRow text="10 AI remixes/month" included />
              <FeatureRow text="Full report + lyrics" included />
              <FeatureRow text="WAV + MP3 download" included />
              <FeatureRow text="Priority processing" included />
            </ul>
            {isActive('pro') ? (
              <Button onClick={comingSoon} className="w-full rounded-lg bg-primary/20 text-primary border border-primary/30">Manage</Button>
            ) : (
              <Button onClick={() => handleCheckout(PRICES.pro_monthly, user?.id)} className="w-full rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground border-0 font-bold">
                Upgrade to Pro <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Studio */}
          <div className={`rounded-xl border p-5 flex flex-col ${isActive('studio') ? 'border-accent/40 bg-accent/5' : 'border-border bg-card'}`}>
            <div className="flex items-center gap-2 mb-3"><Crown className="h-4 w-4 text-accent" /><span className="font-semibold text-foreground">Studio</span></div>
            <p className="text-3xl font-bold text-foreground mb-1">$49</p>
            <p className="text-xs text-accent font-medium mb-4">For teams & labels</p>
            <ul className="space-y-2 flex-1 mb-4">
              <FeatureRow text="Everything in Pro" included />
              <FeatureRow text="Unlimited remixes" included />
              <FeatureRow text="API access" included />
              <FeatureRow text="Team seats" included />
              <FeatureRow text="Priority support" included />
            </ul>
            {isActive('studio') ? (
              <Button onClick={comingSoon} className="w-full rounded-lg bg-accent/20 text-accent border border-accent/30">Manage</Button>
            ) : (
              <Button onClick={() => handleCheckout(PRICES.studio_monthly, user?.id)} className="w-full rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground border-0 font-bold">
                Go Studio
              </Button>
            )}
          </div>
        </div>

        {/* Payment info */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" /> Payment Information
          </h2>
          {profile?.stripe_customer_id ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">{profile.subscription_status || 'Active'}</Badge></div>
              {profile.plan_expires_at && <div className="flex justify-between"><span className="text-muted-foreground">Next renewal</span><span className="text-foreground">{new Date(profile.plan_expires_at).toLocaleDateString()}</span></div>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payment method on file. Upgrade to add one.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
