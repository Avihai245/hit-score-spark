import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { ScrollText, Search, User, CreditCard, Shield, Music2, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

const MOCK_LOGS = [
  { id: 1, action: 'User plan changed', details: 'user@email.com → Pro', actor: 'admin@viralize.app', type: 'billing', time: '10 min ago' },
  { id: 2, action: 'Credits added', details: '+50 credits to producer@music.com', actor: 'admin@viralize.app', type: 'billing', time: '1 hour ago' },
  { id: 3, action: 'Feature flag toggled', details: 'AI Remix → disabled', actor: 'admin@viralize.app', type: 'system', time: '2 hours ago' },
  { id: 4, action: 'New user signup', details: 'artist@gmail.com registered', actor: 'system', type: 'user', time: '3 hours ago' },
  { id: 5, action: 'Analysis completed', details: '"Summer Vibes" scored 82', actor: 'system', type: 'analysis', time: '4 hours ago' },
  { id: 6, action: 'User deleted', details: 'inactive@old.com removed', actor: 'admin@viralize.app', type: 'user', time: '1 day ago' },
  { id: 7, action: 'Banner updated', details: 'Announcement banner enabled', actor: 'admin@viralize.app', type: 'system', time: '2 days ago' },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  billing: <CreditCard className="w-3.5 h-3.5 text-accent" />,
  user: <User className="w-3.5 h-3.5 text-primary" />,
  system: <Settings className="w-3.5 h-3.5 text-muted-foreground" />,
  analysis: <Music2 className="w-3.5 h-3.5 text-emerald-400" />,
};

export default function AdminAudit() {
  const [search, setSearch] = useState('');
  const filtered = MOCK_LOGS.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminNav />
        <main className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Audit & Activity Logs</h1>
              <p className="text-xs text-muted-foreground">Track all administrative actions</p>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..."
                className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm placeholder:text-muted-foreground" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {filtered.map(log => (
                <div key={log.id} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                    {TYPE_ICONS[log.type] || <ScrollText className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{log.action}</p>
                    <p className="text-xs text-muted-foreground">{log.details}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">by {log.actor} · {log.time}</p>
                  </div>
                  <Badge className="bg-muted text-muted-foreground border-0 text-[9px] shrink-0">{log.type}</Badge>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
