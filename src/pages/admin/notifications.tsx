import { useState, useEffect, useCallback } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Megaphone, Send, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  audience: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  created_by: string | null;
}

export default function AdminNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [type, setType] = useState('announcement');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('viralize_admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        if (import.meta.env.DEV) console.warn('Notifications fetch error:', error.message);
        setNotifications([]);
      } else {
        setNotifications(data || []);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Notifications exception:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from('viralize_admin_notifications')
        .insert({
          title: title.trim(),
          message: message.trim(),
          type,
          audience,
          status: 'sent',
          sent_at: new Date().toISOString(),
          created_by: user?.id || null,
        });

      if (error) {
        toast.error('Failed to send notification', { description: error.message });
      } else {
        toast.success('Notification sent successfully');
        setTitle('');
        setMessage('');
        fetchNotifications();
      }
    } catch (err) {
      toast.error('System error sending notification');
    } finally {
      setSending(false);
    }
  };

  const audienceLabel: Record<string, string> = {
    all: 'All Users',
    free_users: 'Free Users',
    paid_users: 'Paid Users',
    pro_users: 'Pro Users',
    studio_users: 'Studio Users',
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
                <h1 className="text-2xl font-bold">Messaging & Notifications</h1>
                <p className="text-xs text-muted-foreground">Send announcements to users</p>
              </div>
            </div>
            <button onClick={fetchNotifications} disabled={loading} className="p-1.5 text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted/30 transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>

          {/* Compose */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" /> Compose Message
            </h2>
            <div className="space-y-3">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Notification title"
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm"
              />
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Message content..."
                rows={3}
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm resize-none"
              />
              <div className="flex items-center gap-3">
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm"
                >
                  <option value="announcement">Announcement</option>
                  <option value="product_update">Product Update</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="billing">Billing</option>
                  <option value="warning">Warning</option>
                </select>
                <select
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                  className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm"
                >
                  <option value="all">All Users</option>
                  <option value="free_users">Free Users</option>
                  <option value="paid_users">Paid Users</option>
                  <option value="pro_users">Pro Users</option>
                  <option value="studio_users">Studio Users</option>
                </select>
                <Button
                  onClick={handleSend}
                  disabled={sending || !title.trim() || !message.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg gap-1.5"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {sending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold">Send History</h2>
            </div>
            <div className="divide-y divide-border">
              {loading ? (
                <div className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading history...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-12 text-center text-muted-foreground">
                  <Megaphone className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No notifications sent yet.</p>
                </div>
              ) : (
                notifications.map(h => (
                  <div key={h.id} className="px-4 py-3 flex items-center gap-3">
                    <Megaphone className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{h.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {audienceLabel[h.audience] || h.audience} · {h.sent_at ? format(new Date(h.sent_at), 'MMM d, yyyy HH:mm') : 'Draft'}
                      </p>
                    </div>
                    <Badge className="bg-muted text-muted-foreground border-0 text-[9px]">{h.type}</Badge>
                    <Badge className={`border-0 text-[10px] ${
                      h.status === 'sent' || h.status === 'delivered'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>{h.status}</Badge>
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
