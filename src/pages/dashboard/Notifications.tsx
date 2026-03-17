import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Bell, CheckCircle, CreditCard, Music2, Zap, Megaphone, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

type NotifType = 'all' | 'analysis' | 'billing' | 'system';

const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'analysis', title: 'Analysis Complete', desc: 'Your song "Midnight Drive" scored 78/100', time: '2 hours ago', read: false, icon: <Music2 className="w-4 h-4 text-primary" /> },
  { id: '2', type: 'billing', title: 'Payment Received', desc: 'Pro plan renewed successfully — $19.00', time: '1 day ago', read: false, icon: <CreditCard className="w-4 h-4 text-emerald-400" /> },
  { id: '3', type: 'system', title: 'New Feature: Compare Mode', desc: 'Compare your tracks against viral benchmarks', time: '3 days ago', read: true, icon: <Zap className="w-4 h-4 text-accent" /> },
  { id: '4', type: 'analysis', title: 'Analysis Complete', desc: 'Your song "Summer Breeze" scored 62/100', time: '5 days ago', read: true, icon: <Music2 className="w-4 h-4 text-primary" /> },
  { id: '5', type: 'system', title: 'Weekly Tip', desc: 'Songs with hooks in the first 10s perform 3x better on TikTok', time: '1 week ago', read: true, icon: <Megaphone className="w-4 h-4 text-muted-foreground" /> },
];

export default function Notifications() {
  const [filter, setFilter] = useState<NotifType>('all');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));

  const filters: { id: NotifType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'analysis', label: 'Analyses' },
    { id: 'billing', label: 'Billing' },
    { id: 'system', label: 'System' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5 w-fit">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {filtered.map(n => (
            <div
              key={n.id}
              className={`px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
            >
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                {n.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">{n.time}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
