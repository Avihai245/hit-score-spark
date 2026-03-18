import { useState, useEffect, useCallback } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { MessageSquare, Clock, CheckCircle, AlertCircle, RefreshCw, Loader2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  user_email?: string;
}

export default function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('viralize_support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (import.meta.env.DEV) console.warn('Support tickets fetch error:', error.message);
        setTickets([]);
      } else {
        // Enrich with user emails
        const userIds = [...new Set((data || []).map(t => t.user_id))];
        let emailMap: Record<string, string> = {};
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from('viralize_users')
            .select('id, email')
            .in('id', userIds);
          if (users) {
            users.forEach(u => { emailMap[u.id] = u.email; });
          }
        }
        setTickets((data || []).map(t => ({
          ...t,
          user_email: emailMap[t.user_id] || 'Unknown user',
        })));
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Support tickets exception:', err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    const { error } = await supabase
      .from('viralize_support_tickets')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(newStatus === 'resolved' ? { resolved_at: new Date().toISOString() } : {}),
      })
      .eq('id', ticketId);

    if (error) {
      toast.error('Failed to update ticket');
    } else {
      toast.success(`Ticket marked as ${newStatus}`);
      fetchTickets();
    }
  };

  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  const filtered = filterStatus === 'all' ? tickets : tickets.filter(t => t.status === filterStatus);

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
                <h1 className="text-2xl font-bold">Support Tickets</h1>
                <p className="text-xs text-muted-foreground">
                  {loading ? 'Loading...' : `${openCount} open ticket${openCount !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <button onClick={fetchTickets} disabled={loading} className="p-1.5 text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted/30 transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <button onClick={() => setFilterStatus('open')} className={`bg-card border rounded-xl p-4 text-center transition-colors ${filterStatus === 'open' ? 'border-accent' : 'border-border'}`}>
              <p className="text-2xl font-bold text-accent">{loading ? '—' : openCount}</p>
              <p className="text-xs text-muted-foreground">Open</p>
            </button>
            <button onClick={() => setFilterStatus('in_progress')} className={`bg-card border rounded-xl p-4 text-center transition-colors ${filterStatus === 'in_progress' ? 'border-yellow-400' : 'border-border'}`}>
              <p className="text-2xl font-bold text-yellow-400">{loading ? '—' : inProgressCount}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </button>
            <button onClick={() => setFilterStatus('resolved')} className={`bg-card border rounded-xl p-4 text-center transition-colors ${filterStatus === 'resolved' ? 'border-emerald-400' : 'border-border'}`}>
              <p className="text-2xl font-bold text-emerald-400">{loading ? '—' : resolvedCount}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </button>
            <button onClick={() => setFilterStatus('all')} className={`bg-card border rounded-xl p-4 text-center transition-colors ${filterStatus === 'all' ? 'border-primary' : 'border-border'}`}>
              <p className="text-2xl font-bold text-foreground">{loading ? '—' : tickets.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </button>
          </div>

          {/* Ticket List */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {loading ? (
                <div className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading tickets...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-12 text-center text-muted-foreground">
                  <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">
                    {tickets.length === 0
                      ? 'No support tickets yet.'
                      : `No ${filterStatus} tickets found.`}
                  </p>
                </div>
              ) : (
                filtered.map(t => (
                  <div key={t.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      t.status === 'open' ? 'bg-accent/10' :
                      t.status === 'in_progress' ? 'bg-yellow-500/10' :
                      'bg-emerald-500/10'
                    }`}>
                      {t.status === 'open' ? <Clock className="w-4 h-4 text-accent" /> :
                       t.status === 'in_progress' ? <AlertCircle className="w-4 h-4 text-yellow-400" /> :
                       <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.user_email} · {format(new Date(t.created_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
                    <Badge className={`border text-[10px] ${
                      t.priority === 'high' ? 'bg-destructive/15 text-destructive border-destructive/20' :
                      t.priority === 'medium' ? 'bg-accent/15 text-accent border-accent/20' :
                      'bg-muted text-muted-foreground border-border'
                    }`}>{t.priority}</Badge>
                    <Badge className={`border-0 text-[10px] ${
                      t.status === 'open' ? 'bg-accent/15 text-accent' :
                      t.status === 'in_progress' ? 'bg-yellow-500/15 text-yellow-400' :
                      'bg-emerald-500/15 text-emerald-400'
                    }`}>{t.status}</Badge>
                    {t.status === 'open' && (
                      <button
                        onClick={() => handleStatusChange(t.id, 'in_progress')}
                        className="text-[10px] px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                      >
                        Start
                      </button>
                    )}
                    {(t.status === 'open' || t.status === 'in_progress') && (
                      <button
                        onClick={() => handleStatusChange(t.id, 'resolved')}
                        className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
