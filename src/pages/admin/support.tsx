import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { MessageSquare, Clock, CheckCircle, AlertCircle, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MOCK_TICKETS = [
  { id: 1, subject: 'Analysis stuck on processing', user: 'user@example.com', status: 'open', priority: 'high', date: '2 hours ago' },
  { id: 2, subject: 'Cannot download remix file', user: 'artist@music.com', status: 'open', priority: 'medium', date: '5 hours ago' },
  { id: 3, subject: 'Billing question about Pro plan', user: 'producer@gmail.com', status: 'resolved', priority: 'low', date: '1 day ago' },
  { id: 4, subject: 'Score seems inaccurate for my genre', user: 'beats@studio.com', status: 'resolved', priority: 'medium', date: '2 days ago' },
];

export default function AdminSupport() {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminNav />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Support Tickets</h1>
            <p className="text-xs text-muted-foreground">{MOCK_TICKETS.filter(t => t.status === 'open').length} open tickets</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-accent">{MOCK_TICKETS.filter(t => t.status === 'open').length}</p>
              <p className="text-xs text-muted-foreground">Open</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{MOCK_TICKETS.filter(t => t.status === 'resolved').length}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{MOCK_TICKETS.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {MOCK_TICKETS.map(t => (
                <div key={t.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.status === 'open' ? 'bg-accent/10' : 'bg-emerald-500/10'}`}>
                    {t.status === 'open' ? <Clock className="w-4 h-4 text-accent" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">{t.user} · {t.date}</p>
                  </div>
                  <Badge className={`border text-[10px] ${
                    t.priority === 'high' ? 'bg-destructive/15 text-destructive border-destructive/20' :
                    t.priority === 'medium' ? 'bg-accent/15 text-accent border-accent/20' :
                    'bg-muted text-muted-foreground border-border'
                  }`}>{t.priority}</Badge>
                  <Badge className={`border-0 text-[10px] ${t.status === 'open' ? 'bg-accent/15 text-accent' : 'bg-emerald-500/15 text-emerald-400'}`}>
                    {t.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
