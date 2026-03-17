import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Megaphone, Send, Bell, Users, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

const HISTORY = [
  { id: 1, title: 'New AI Remix Feature', type: 'product_update', audience: 'All Users', sent: '3 days ago', status: 'delivered' },
  { id: 2, title: 'Pro Plan Price Update', type: 'billing', audience: 'Pro Users', sent: '1 week ago', status: 'delivered' },
  { id: 3, title: 'Scheduled Maintenance', type: 'maintenance', audience: 'All Users', sent: '2 weeks ago', status: 'delivered' },
];

export default function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');

  const handleSend = () => {
    if (!title || !message) return;
    toast.success('Notification sent (placeholder)');
    setTitle('');
    setMessage('');
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
                  <option value="paid">Paid Users</option>
                  <option value="pro">Pro Users</option>
                  <option value="studio">Studio Users</option>
                </select>
                <Button onClick={handleSend} className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Send
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
              {HISTORY.map(h => (
                <div key={h.id} className="px-4 py-3 flex items-center gap-3">
                  <Megaphone className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{h.title}</p>
                    <p className="text-xs text-muted-foreground">{h.audience} · {h.sent}</p>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">{h.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
