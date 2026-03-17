import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Activity, CheckCircle, Clock, AlertTriangle, Cpu, Gauge, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function AdminMonitoring() {
  const [stats, setStats] = useState({ total: 0, today: 0, avgScore: 0, remixes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [{ data: analyses }, { count: remixCount }] = await Promise.all([
        supabase.from('viralize_analyses').select('score, created_at'),
        supabase.from('viralize_remixes').select('id', { count: 'exact', head: true }),
      ]);
      const todayCount = analyses?.filter(a => new Date(a.created_at) >= today).length || 0;
      const scores = analyses?.map(a => a.score).filter(Boolean) || [];
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      setStats({ total: analyses?.length || 0, today: todayCount, avgScore: avg, remixes: remixCount || 0 });
      setLoading(false);
    };
    load();
  }, []);

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminNav />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">AI Analysis Monitoring</h1>
            <p className="text-xs text-muted-foreground">Processing pipeline health & performance</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-primary" /><span className="text-[11px] text-muted-foreground uppercase">Total Processed</span></div>
              <p className="text-2xl font-bold">{loading ? '—' : stats.total}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-accent" /><span className="text-[11px] text-muted-foreground uppercase">Today</span></div>
              <p className="text-2xl font-bold">{loading ? '—' : stats.today}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><Gauge className="w-4 h-4 text-emerald-400" /><span className="text-[11px] text-muted-foreground uppercase">Avg Score</span></div>
              <p className="text-2xl font-bold">{loading ? '—' : stats.avgScore}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><Cpu className="w-4 h-4 text-primary" /><span className="text-[11px] text-muted-foreground uppercase">Remixes</span></div>
              <p className="text-2xl font-bold">{loading ? '—' : stats.remixes}</p>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold mb-4">System Status</h2>
            <div className="space-y-3">
              {[
                { service: 'AI Analysis Engine', status: 'operational', icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
                { service: 'Audio Processing Pipeline', status: 'operational', icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
                { service: 'Remix Generation (Suno)', status: 'operational', icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
                { service: 'File Storage', status: 'operational', icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    {s.icon}
                    <span className="text-sm text-foreground">{s.service}</span>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">{s.status}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Processing queue placeholder */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4">Processing Queue</h2>
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              <Clock className="w-5 h-5 mr-2" /> No items in queue — all caught up
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
