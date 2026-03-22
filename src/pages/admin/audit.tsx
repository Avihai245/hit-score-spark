import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { ScrollText, Search, User, CreditCard, Settings, Music2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  details: string | null;
  actor_id: string | null;
  user_id: string | null;
  created_at: string;
  ip_address: string | null;
  metadata: Record<string, any> | null;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  billing:  <CreditCard className="w-3.5 h-3.5 text-accent" />,
  user:     <User className="w-3.5 h-3.5 text-primary" />,
  system:   <Settings className="w-3.5 h-3.5 text-muted-foreground" />,
  analysis: <Music2 className="w-3.5 h-3.5 text-emerald-400" />,
};

function getLogType(action: string): string {
  const a = action.toLowerCase();
  if (a.includes('credit') || a.includes('plan') || a.includes('payment')) return 'billing';
  if (a.includes('user') || a.includes('login') || a.includes('signup')) return 'user';
  if (a.includes('analysis') || a.includes('remix')) return 'analysis';
  return 'system';
}

function Skeleton() {
  return (
    <div className="divide-y divide-border">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-muted/50 animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-muted/50 rounded animate-pulse w-2/5" />
            <div className="h-3 bg-muted/30 rounded animate-pulse w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminAudit() {
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (!error) setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  const filtered = logs.filter(l =>
    !search ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.details?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminNav />
        <main className="flex-1 overflow-auto p-4 md:p-6 ml-0 md:ml-56">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold">Audit & Activity Logs</h1>
              <p className="text-xs text-muted-foreground">Real-time administrative action history</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load} className="p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors" title="Refresh">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..."
                  className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm placeholder:text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {loading ? <Skeleton /> : filtered.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <ScrollText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{search ? 'No matching logs' : 'No audit logs yet'}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map(log => {
                  const type = getLogType(log.action);
                  return (
                    <div key={log.id} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                        {TYPE_ICONS[type] || <ScrollText className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{log.action}</p>
                        {log.details && <p className="text-xs text-muted-foreground">{log.details}</p>}
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                          {log.actor_id ? `by ${log.actor_id.slice(0, 8)}…` : 'system'} ·{' '}
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          {log.ip_address ? ` · ${log.ip_address}` : ''}
                        </p>
                      </div>
                      <Badge className="bg-muted text-muted-foreground border-0 text-[9px] shrink-0">{type}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && (
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span>Showing {filtered.length} of {logs.length} entries (page {page + 1})</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted/50 transition-colors">← Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={logs.length < PAGE_SIZE}
                  className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted/50 transition-colors">Next →</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
