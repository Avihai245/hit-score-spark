import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_LIMITS, Plan } from '@/lib/supabase';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Coins, BarChart2, RefreshCw, Zap, ArrowRight, AlertTriangle, Calendar } from 'lucide-react';

export default function Credits() {
  const { profile } = useAuth();
  const plan: Plan = (profile?.plan as Plan) || 'free';
  const limits = PLAN_LIMITS[plan];
  const analysesUsed = profile?.analyses_used || 0;
  const remixesUsed = profile?.remixes_this_month || 0;
  const credits = profile?.credits || 0;

  const analysisPercent = limits.analyses === 999 ? 5 : Math.min((analysesUsed / limits.analyses) * 100, 100);
  const remixPercent = limits.remixes === 999 ? 5 : limits.remixes === 0 ? 0 : Math.min((remixesUsed / limits.remixes) * 100, 100);
  const nearLimit = analysisPercent >= 80 || remixPercent >= 80;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Credits & Usage</h1>
          <p className="text-sm text-muted-foreground">Monitor your plan usage and remaining credits</p>
        </div>

        {/* Near limit warning */}
        {nearLimit && plan !== 'studio' && (
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Approaching usage limit</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You're nearing your monthly limit. Upgrade your plan for unlimited access.
              </p>
            </div>
            <Button asChild size="sm" className="ml-auto shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg text-xs">
              <Link to="/dashboard/billing">Upgrade</Link>
            </Button>
          </div>
        )}

        {/* Current Plan */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Current Plan</p>
                <Badge className="bg-primary/10 text-primary border-0 text-[10px] uppercase mt-0.5">{PLAN_LIMITS[plan].label}</Badge>
              </div>
            </div>
            {plan !== 'studio' && (
              <Button asChild size="sm" variant="outline" className="rounded-lg text-xs border-border">
                <Link to="/dashboard/billing">Change Plan <ArrowRight className="w-3 h-3 ml-1" /></Link>
              </Button>
            )}
          </div>

          {/* Usage meters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Analyses</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Used this month</span>
                <span className="font-semibold text-foreground">
                  {analysesUsed} / {limits.analyses === 999 ? '∞' : limits.analyses}
                </span>
              </div>
              <Progress value={analysisPercent} className="h-2 bg-muted [&>div]:bg-primary" />
            </div>

            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-foreground">Remixes</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Used this month</span>
                <span className="font-semibold text-foreground">
                  {limits.remixes === 0 ? 'N/A' : `${remixesUsed} / ${limits.remixes === 999 ? '∞' : limits.remixes}`}
                </span>
              </div>
              <Progress value={remixPercent} className="h-2 bg-muted [&>div]:bg-accent" />
            </div>
          </div>

          {/* Credits balance for PAYG */}
          {(profile?.credits ?? 0) > 0 && (
            <div className="mt-4 bg-muted/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm font-medium text-foreground">Credit Balance</p>
                  <p className="text-xs text-muted-foreground">Credits never expire</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-accent">{credits}</p>
            </div>
          )}
        </div>

        {/* Usage History placeholder */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Usage History</h2>
          </div>
          <div className="space-y-2">
            {[
              { date: 'This month', analyses: analysesUsed, remixes: remixesUsed },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{row.date}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-foreground">{row.analyses} analyses</span>
                  <span className="text-foreground">{row.remixes} remixes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
