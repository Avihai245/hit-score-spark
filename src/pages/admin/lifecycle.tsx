import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Heart, Users, TrendingUp, AlertTriangle, UserCheck, UserX, Star, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { subDays, subMonths } from 'date-fns';

const LIFECYCLE_STAGES = [
  { id: 'registered', label: 'Registered', color: 'bg-muted text-muted-foreground' },
  { id: 'active', label: 'Active', color: 'bg-blue-500/15 text-blue-400' },
  { id: 'paying', label: 'Paying', color: 'bg-emerald-500/15 text-emerald-400' },
  { id: 'high_value', label: 'High Value', color: 'bg-primary/15 text-primary' },
  { id: 'churn_risk', label: 'Churn Risk', color: 'bg-destructive/15 text-destructive' },
];

export default function AdminLifecycle() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('viralize_users').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setUsers(data || []); setLoading(false); });
  }, []);

  const now = new Date();
  const weekAgo = subDays(now, 7);
  const monthAgo = subMonths(now, 1);

  const registered = users.length;
  const paying = users.filter(u => u.plan !== 'free').length;
  const activeRecent = users.filter(u => new Date(u.updated_at || u.created_at) >= weekAgo).length;
  const churnRisk = users.filter(u => u.plan !== 'free' && new Date(u.updated_at || u.created_at) < monthAgo).length;

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminNav />
        <main className="flex-1 overflow-auto p-4 md:p-6 ml-0 md:ml-56">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">CRM & Lifecycle</h1>
            <p className="text-xs text-muted-foreground">User segmentation and retention</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-primary" /><span className="text-[11px] text-muted-foreground uppercase">Registered</span></div>
              <p className="text-2xl font-bold">{loading ? '—' : registered}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><UserCheck className="w-4 h-4 text-emerald-400" /><span className="text-[11px] text-muted-foreground uppercase">Paying</span></div>
              <p className="text-2xl font-bold">{loading ? '—' : paying}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-blue-400" /><span className="text-[11px] text-muted-foreground uppercase">Active (7d)</span></div>
              <p className="text-2xl font-bold">{loading ? '—' : activeRecent}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-destructive" /><span className="text-[11px] text-muted-foreground uppercase">Churn Risk</span></div>
              <p className="text-2xl font-bold">{loading ? '—' : churnRisk}</p>
            </div>
          </div>

          {/* Lifecycle funnel */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold mb-4">Lifecycle Funnel</h2>
            <div className="flex gap-2 items-center">
              {[
                { label: 'Registered', count: registered, pct: 100 },
                { label: 'Active', count: activeRecent, pct: registered > 0 ? Math.round((activeRecent / registered) * 100) : 0 },
                { label: 'Paying', count: paying, pct: registered > 0 ? Math.round((paying / registered) * 100) : 0 },
              ].map((step, i) => (
                <div key={i} className="flex-1 flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{step.label}</span>
                      <span className="text-foreground font-medium">{step.count} ({step.pct}%)</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${step.pct}%` }} />
                    </div>
                  </div>
                  {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          {/* Segments */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4">User Segments</h2>
            <div className="space-y-2">
              {LIFECYCLE_STAGES.map(stage => {
                const count = stage.id === 'registered' ? registered :
                  stage.id === 'paying' ? paying :
                  stage.id === 'active' ? activeRecent :
                  stage.id === 'churn_risk' ? churnRisk :
                  stage.id === 'high_value' ? users.filter(u => u.plan === 'studio').length : 0;
                return (
                  <div key={stage.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <Badge className={`${stage.color} border-0 text-xs`}>{stage.label}</Badge>
                    <span className="text-sm font-medium text-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
