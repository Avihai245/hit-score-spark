import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Megaphone, Send, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  audience: string;
  created_at: string;
}

export default function AdminNotifications() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [history, setHistory] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setHistory(data);
    setLoading(false);
  };

  useEffect(() => { loadHistory(); }, []);

  const handleSend = async () => {
    if (!title || !message) return;
    setSending(true);
    const { error } = await supabase
      .from('admin_notifications')
      .insert({ title, message, audience, sent_by: user?.id });
    if (error) {
      toast.error('Failed to send: ' + error.message);
    } else {
      toast.success('Notification sent');
      setTitle('');
      setMessage('');
      loadHistory();
    }
    setSending(false);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminNav />
        <main className="flex-1 overflow-auto p-4 md:p-6 ml-0 md:ml-56">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Messaging & Notifications</h1>
            <p className="text-xs text-muted-foreground">Send announcements to users</p>
          </div>

          {/* Compose */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><Send className="w-4 h-4 text-primary" /> Compose Message</h2>
            <div className="space-y-3">
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title"
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm" />
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message content..." rows={3}
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm resize-none" />
              <div className="flex items-center gap-3">
                <select value={audience} onChange={e => setAudience(e.target.value)}
                  className="px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm">
                  <option value="all">All Users</option>
                  <option value="free">Free Users</option>
                  <option value="pro">Pro Users</option>
                  <option value="studio">Studio Users</option>
                </select>
                <Button onClick={handleSend} disabled={sending || !title || !message}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg gap-1.5">
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send
                </Button>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold">Send History</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No notifications sent yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {history.map(h => (
                  <div key={h.id} className="px-4 py-3 flex items-center gap-3">
                    <Megaphone className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{h.title}</p>
                      <p className="text-xs text-muted-foreground">{h.audience === 'all' ? 'All Users' : `${h.audience} Users`} \u00b7 {timeAgo(h.created_at)}</p>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">delivered</Badge>
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
