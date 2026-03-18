import { useState, useEffect, useCallback } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { CheckCircle, AlertTriangle, Server, Database, Globe, Cpu, RefreshCw, Loader2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'slow' | 'down' | 'checking';
  latency: number | null;
  icon: React.ReactNode;
  lastChecked: Date | null;
}

interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  plans: string[];
}

const DEFAULT_FLAGS: FeatureFlag[] = [
  { id: 'remix_ai', name: 'AI Remix Feature', enabled: true, plans: ['pro', 'studio'] },
  { id: 'batch_analyze', name: 'Batch Analysis', enabled: true, plans: ['studio'] },
  { id: 'api_access', name: 'API Access', enabled: true, plans: ['studio'] },
  { id: 'export_pdf', name: 'PDF Export', enabled: true, plans: ['pro', 'studio'] },
  { id: 'genre_detection', name: 'Auto Genre Detection', enabled: true, plans: ['all'] },
];

export default function AdminSystem() {
  const [checks, setChecks] = useState<HealthCheck[]>([
    { service: 'Supabase Database', status: 'checking', latency: null, icon: <Database className="w-4 h-4" />, lastChecked: null },
    { service: 'AI Analysis API', status: 'checking', latency: null, icon: <Cpu className="w-4 h-4" />, lastChecked: null },
    { service: 'Suno Remix API', status: 'checking', latency: null, icon: <Server className="w-4 h-4" />, lastChecked: null },
    { service: 'Stripe Payments', status: 'checking', latency: null, icon: <Globe className="w-4 h-4" />, lastChecked: null },
  ]);
  const [flags, setFlags] = useState<FeatureFlag[]>(DEFAULT_FLAGS);
  const [dbStats, setDbStats] = useState({ users: 0, analyses: 0, remixes: 0, credits: 0 });
  const [loading, setLoading] = useState(true);

  const runHealthChecks = useCallback(async () => {
    setLoading(true);
    const now = new Date();

    // 1. Check Supabase Database
    const dbStart = Date.now();
    try {
      const { error } = await supabase.from('viralize_users').select('id', { count: 'exact', head: true });
      const dbLatency = Date.now() - dbStart;
      setChecks(prev => prev.map(c =>
        c.service === 'Supabase Database' ? {
          ...c,
          status: error ? 'down' : dbLatency < 1000 ? 'healthy' : 'slow',
          latency: dbLatency,
          lastChecked: now,
        } : c
      ));
    } catch {
      setChecks(prev => prev.map(c =>
        c.service === 'Supabase Database' ? { ...c, status: 'down', latency: null, lastChecked: now } : c
      ));
    }

    // 2. Check AI Analysis API
    const lambdaUrl = import.meta.env.VITE_LAMBDA_URL;
    if (lambdaUrl) {
      const apiStart = Date.now();
      try {
        const resp = await fetch(lambdaUrl, { method: 'OPTIONS', signal: AbortSignal.timeout(5000) });
        const apiLatency = Date.now() - apiStart;
        setChecks(prev => prev.map(c =>
          c.service === 'AI Analysis API' ? {
            ...c,
            status: apiLatency < 2000 ? 'healthy' : 'slow',
            latency: apiLatency,
            lastChecked: now,
          } : c
        ));
      } catch {
        setChecks(prev => prev.map(c =>
          c.service === 'AI Analysis API' ? { ...c, status: 'down', latency: null, lastChecked: now } : c
        ));
      }
    } else {
      setChecks(prev => prev.map(c =>
        c.service === 'AI Analysis API' ? { ...c, status: 'down', latency: null, lastChecked: now } : c
      ));
    }

    // 3. Check Suno API
    const sunoUrl = import.meta.env.VITE_SUNO_API;
    if (sunoUrl) {
      const sunoStart = Date.now();
      try {
        await fetch(sunoUrl, { method: 'OPTIONS', signal: AbortSignal.timeout(5000) });
        const sunoLatency = Date.now() - sunoStart;
        setChecks(prev => prev.map(c =>
          c.service === 'Suno Remix API' ? {
            ...c,
            status: sunoLatency < 2000 ? 'healthy' : 'slow',
            latency: sunoLatency,
            lastChecked: now,
          } : c
        ));
      } catch {
        setChecks(prev => prev.map(c =>
          c.service === 'Suno Remix API' ? { ...c, status: 'down', latency: null, lastChecked: now } : c
        ));
      }
    } else {
      setChecks(prev => prev.map(c =>
        c.service === 'Suno Remix API' ? { ...c, status: 'down', latency: null, lastChecked: now } : c
      ));
    }

    // 4. Check Stripe — just verify the script tag loaded
    const stripeLoaded = !!(window as any).Stripe || !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    setChecks(prev => prev.map(c =>
      c.service === 'Stripe Payments' ? {
        ...c,
        status: stripeLoaded ? 'healthy' : 'down',
        latency: stripeLoaded ? 0 : null,
        lastChecked: now,
      } : c
    ));

    // Fetch DB stats
    try {
      const [users, analyses, remixes] = await Promise.all([
        supabase.from('viralize_users').select('id', { count: 'exact', head: true }),
        supabase.from('viralize_analyses').select('id', { count: 'exact', head: true }),
        supabase.from('viralize_remixes').select('id', { count: 'exact', head: true }),
      ]);
      setDbStats({
        users: users.count || 0,
        analyses: analyses.count || 0,
        remixes: remixes.count || 0,
        credits: 0,
      });
    } catch {
      // Stats fetch failed — leave defaults
    }

    // Load feature flags from admin_settings if exists
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('key', 'feature_flags')
        .single();
      if (data?.value?.length) setFlags(data.value);
    } catch {
      // Table may not exist
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    runHealthChecks();
    const interval = setInterval(runHealthChecks, 30000);
    return () => clearInterval(interval);
  }, [runHealthChecks]);

  const statusIcon = (status: string) => {
    if (status === 'healthy') return <CheckCircle className="w-3 h-3 text-emerald-400" />;
    if (status === 'slow') return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
    if (status === 'down') return <XCircle className="w-3 h-3 text-red-400" />;
    return <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />;
  };

  const statusColor = (status: string) => {
    if (status === 'healthy') return 'text-emerald-400';
    if (status === 'slow') return 'text-yellow-400';
    if (status === 'down') return 'text-red-400';
    return 'text-muted-foreground';
  };

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminNav mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 ml-0 md:ml-56">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileNavOpen(true)} className="md:hidden p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-muted/50 border border-border">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold">System Configuration</h1>
                <p className="text-xs text-muted-foreground">Platform health and settings overview</p>
              </div>
            </div>
            <button onClick={runHealthChecks} disabled={loading} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/30 transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Check
            </button>
          </div>

          {/* System Health */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold mb-4">System Health</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {checks.map((check, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="text-muted-foreground">{check.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{check.service}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {statusIcon(check.status)}
                      <span className={`text-[10px] ${statusColor(check.status)}`}>
                        {check.status}
                        {check.latency !== null ? ` (${check.latency}ms)` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Database Stats */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold mb-4">Database Stats</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{loading ? '—' : dbStats.users.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Users</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-2xl font-bold text-accent">{loading ? '—' : dbStats.analyses.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Analyses</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-2xl font-bold text-emerald-400">{loading ? '—' : dbStats.remixes.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Remixes</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-400">{loading ? '—' : dbStats.credits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Credits</p>
              </div>
            </div>
          </div>

          {/* Feature Flags */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold mb-4">Feature Flags</h2>
            <div className="space-y-2">
              {flags.map((flag, i) => (
                <div key={flag.id || i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
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
              <div className="flex justify-between"><span className="text-muted-foreground">Environment</span><span className="text-foreground">{import.meta.env.MODE}</span></div>
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
