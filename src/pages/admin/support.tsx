import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Ticket {
  id: string;
  subject: string;
  user_email: string | null;
  status: string;
  priority: string;
  created_at: string;
}

export default function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setTickets(data);
      setLoading(false);
    };
    load();
  }, []);

  const openCount = tickets.filter(t => t.status === 'open').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminNav />
        <main className="flex-1 overflow-auto p-4 md:p-6 ml-0 md:ml-56">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Support Tickets</h1>
            <p className="text-xs text-muted-foreground">{openCount} open tickets</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-accent">{openCount}</p>
              <p className="text-xs text-muted-foreground">Open</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{resolvedCount}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{tickets.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No support tickets yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {tickets.map(t => (
                  <div key={t.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.status === 'open' ? 'bg-accent/10' : 'bg-emerald-500/10'}`}>
                      {t.status === 'open' ? <Clock className="w-4 h-4 text-accent" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">{t.user_email || 'Unknown'} \u00b7 {timeAgo(t.created_at)}</p>
                    </div>
                    <Badge className={`border text-[10px] ${
                      t.priority === 'high' || t.priority === 'urgent' ? 'bg-destructive/15 text-destructive border-destructive/20' :
                      t.priority === 'normal' ? 'bg-accent/15 text-accent border-accent/20' :
                      'bg-muted text-muted-foreground border-border'
                    }`}>{t.priority}</Badge>
                    <Badge className={`border-0 text-[10px] ${t.status === 'open' ? 'bg-accent/15 text-accent' : 'bg-emerald-500/15 text-emerald-400'}`}>
                      {t.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
