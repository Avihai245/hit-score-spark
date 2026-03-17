import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Settings, CheckCircle, AlertTriangle, Server, Database, Globe, Cpu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SYSTEM_CHECKS = [
  { service: 'Supabase Database', status: 'healthy', icon: <Database className="w-4 h-4" /> },
  { service: 'AI Analysis API', status: 'healthy', icon: <Cpu className="w-4 h-4" /> },
  { service: 'Suno Remix API', status: 'healthy', icon: <Server className="w-4 h-4" /> },
  { service: 'Stripe Payments', status: 'healthy', icon: <Globe className="w-4 h-4" /> },
];

const FEATURE_FLAGS = [
  { name: 'AI Remix Feature', enabled: true, plans: ['pro', 'studio'] },
  { name: 'Batch Analysis', enabled: true, plans: ['studio'] },
  { name: 'API Access', enabled: true, plans: ['studio'] },
  { name: 'PDF Export', enabled: true, plans: ['pro', 'studio'] },
  { name: 'Auto Genre Detection', enabled: true, plans: ['all'] },
];

export default function AdminSystem() {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminNav />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">System Configuration</h1>
            <p className="text-xs text-muted-foreground">Platform health and settings overview</p>
          </div>

          {/* System Health */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold mb-4">System Health</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {SYSTEM_CHECKS.map((check, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="text-muted-foreground">{check.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{check.service}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400">{check.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Flags */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold mb-4">Feature Flags</h2>
            <div className="space-y-2">
              {FEATURE_FLAGS.map((flag, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm text-foreground">{flag.name}</p>
                    <div className="flex gap-1 mt-1">
                      {flag.plans.map(p => (
                        <Badge key={p} className="bg-muted text-muted-foreground border-0 text-[9px]">{p}</Badge>
                      ))}
                    </div>
                  </div>
                  <Badge className={`border-0 text-[10px] ${flag.enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                    {flag.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Environment info */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4">Environment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Platform</span><span className="text-foreground">Viralize v1.0</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Backend</span><span className="text-foreground">Supabase</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">AI Provider</span><span className="text-foreground">HitCheck API</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payments</span><span className="text-foreground">Stripe</span></div>
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
