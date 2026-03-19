import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_LIMITS, CREDIT_COSTS, Plan, creditBalanceColor } from '@/lib/supabase';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Coins, BarChart2, Sparkles, Zap, ArrowRight, AlertTriangle } from 'lucide-react';

export default function Credits() {
  const { profile } = useAuth();
  const plan: Plan = (profile?.plan as Plan) || 'free';
  const limits = PLAN_LIMITS[plan];
  const credits = profile?.credits || 0;
  const monthlyCredits = limits.monthlyCredits || limits.signupCredits || 50;
  const creditPct = monthlyCredits > 0 ? Math.min(100, (credits / monthlyCredits) * 100) : 0;
  const isLow = credits < CREDIT_COSTS.analysis;
  const colorClass = creditBalanceColor(credits, plan);

  const actions = [
    { label: 'Scan (analyze track)', cost: CREDIT_COSTS.analysis, icon: BarChart2, color: 'text-primary' },
    { label: 'Algorithm Hit (generate viral)', cost: CREDIT_COSTS.viral, icon: Sparkles, color: 'text-orange-400' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Credits & Usage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {plan === 'free' ? `${limits.signupCredits} credits on signup (one-time)` : `${limits.monthlyCredits} credits refresh every month`}
          </p>
        </div>

        {/* Low credits warning */}
        {isLow && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Not enough credits to scan</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You need at least {CREDIT_COSTS.analysis} credits to scan a song. Top up or upgrade.
              </p>
            </div>
            <Button asChild size="sm" className="ml-auto shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg text-xs">
              <Link to="/dashboard/billing#credits">Top up</Link>
            </Button>
          </motion.div>
        )}

        {/* Credit balance card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{limits.label} Plan</p>
                <Badge className="bg-primary/10 text-primary border-0 text-[10px] uppercase mt-0.5">{limits.badge || 'Active'}</Badge>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-4xl font-black tabular-nums ${colorClass}`}>{credits.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">credits remaining</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Usage</span>
              <span>{Math.round(creditPct)}% remaining</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${credits <= 0 ? 'bg-destructive' : creditPct <= 25 ? 'bg-amber-400' : 'bg-primary'}`}
                initial={{ scaleX: 0 }} animate={{ scaleX: creditPct / 100 }}
                style={{ transformOrigin: 'left' }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>

          {plan !== 'free' && (
            <p className="text-[11px] text-muted-foreground mt-3">
              Resets to {limits.monthlyCredits.toLocaleString()} credits every billing cycle
            </p>
          )}
        </div>

        {/* Credit costs */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Credit Costs</h2>
          <div className="space-y-3">
            {actions.map(a => (
              <div key={a.label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <a.icon className={`w-4 h-4 ${a.color} shrink-0`} />
                  <span className="text-sm text-foreground">{a.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-accent" />
                  <span className="text-sm font-bold text-foreground">{a.cost} credits</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.floor(credits / a.cost)} left)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-xl">
            <Link to="/dashboard/billing#credits">
              <Zap className="w-4 h-4 mr-2" /> Buy More Credits
            </Link>
          </Button>
          {plan === 'free' && (
            <Button asChild variant="outline" className="flex-1 rounded-xl border-primary/30 text-primary hover:bg-primary/5">
              <Link to="/dashboard/billing">
                Upgrade Plan <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
