import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { ScrollText, Search, User, CreditCard, Shield, Music2, Settings, RefreshCw, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  admin_id: string | null;
  user_id: string | null;
  created_at: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  billing: <CreditCard className="w-3.5 h-3.5 text-accent" />,
  credits: <CreditCard className="w-3.5 h-3.5 text-accent" />,
  user: <User className="w-3.5 h-3.5 text-primary" />,
  system: <Settings className="w-3.5 h-3.5 text-muted-foreground" />,
  analysis: <Music2 className="w-3.5 h-3.5 text-emerald-400" />,
  subscription: <Shield className="w-3.5 h-3.5 text-purple-400" />,
};

function formatAction(log: AuditLog): { action: string; details: string } {
  const changes: string[] = [];
  if (log.old_value) {
    Object.entries(log.old_value).forEach(([k, v]) => {
      const newVal = log.new_value?.[k];
      if (newVal !== undefined) changes.push(`${k}: ${v} → ${newVal}`);
    });
  } else if (log.new_value) {
    Object.entries(log.new_value).forEach(([k, v]) => {
      changes.push(`${k}: ${v}`);
    });
  }

  const actionLabels: Record<string, string> = {
    plan_updated: 'Plan changed',
    credits_added: 'Credits added',
    user_deleted: 'User deleted',
    subscription_updated: 'Subscription updated',
  };

  return {
    action: actionLabels[log.action] || log.action.replace(/_/g, ' '),
    details: changes.join(', ') || `${log.resource_type} ${log.resource_id?.slice(0, 8)}`,
  };
}

export default function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('viralize_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        if (import.meta.env.DEV) console.warn('Audit logs fetch error:', error.message);
        setLogs([]);
      } else {
        setLogs(data || []);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Audit logs exception:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const filtered = logs.filter(l => {
    const { action, details } = formatAction(l);
    const matchSearch =
      !search ||
      action.toLowerCase().includes(search.toLowerCase()) ||
      details.toLowerCase().includes(search.toLowerCase()) ||
      l.resource_type.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || l.resource_type === filterType;
    return matchSearch && matchType;
  });

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
                <h1 className="text-2xl font-bold">Audit & Activity Logs</h1>
                <p className="text-xs text-muted-foreground">
                  {loading ? 'Loading...' : `${filtered.length} events tracked`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-2 py-1.5 bg-muted/30 border border-border rounded-lg text-xs"
              >
                <option value="all">All Types</option>
                <option value="user">Users</option>
                <option value="credits">Credits</option>
                <option value="subscription">Subscriptions</option>
                <option value="system">System</option>
              </select>
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full pl-9 pr-3 py-1.5 bg-muted/50 border border-border rounded-lg text-sm placeholder:text-muted-foreground"
                />
              </div>
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="p-1.5 text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted/30 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {loading && logs.length === 0 ? (
                <div className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading audit logs...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-12 text-center text-muted-foreground">
                  <ScrollText className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">
                    {logs.length === 0
                      ? 'No audit logs yet. Actions will appear here as admins make changes.'
                      : 'No logs match your search.'}
                  </p>
                </div>
              ) : (
                filtered.map(log => {
                  const { action, details } = formatAction(log);
                  return (
                    <div key={log.id} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                        {TYPE_ICONS[log.resource_type] || <ScrollText className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground capitalize">{action}</p>
                        <p className="text-xs text-muted-foreground">{details}</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                          {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                        </p>
                      </div>
                      <Badge className="bg-muted text-muted-foreground border-0 text-[9px] shrink-0">{log.resource_type}</Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
