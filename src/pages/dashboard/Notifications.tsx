import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Bell, CheckCircle, CreditCard, Music2, Zap, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type NotifType = 'all' | 'analysis' | 'billing' | 'system';

interface Notification {
  id: string;
  type: 'analysis' | 'billing' | 'system';
  title: string;
  desc: string;
  time: string;
  read: boolean;
  icon: React.ReactNode;
}

export default function Notifications() {
  const { user, profile } = useAuth();
  const [filter, setFilter] = useState<NotifType>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const notifs: Notification[] = [];

      // Fetch recent analyses as notifications
      const { data: analyses } = await supabase
        .from('viralize_analyses')
        .select('id, title, score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      analyses?.forEach(a => {
        notifs.push({
          id: `analysis-${a.id}`,
          type: 'analysis',
          title: 'Analysis Complete',
          desc: `Your song "${a.title || 'Untitled'}" scored ${a.score}/100`,
          time: getRelativeTime(a.created_at),
          read: true,
          icon: <Music2 className="w-4 h-4 text-primary" />,
        });
      });

      // Fetch recent remixes as notifications
      const { data: remixes } = await supabase
        .from('viralize_remixes')
        .select('id, remix_title, original_title, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      remixes?.forEach(r => {
        notifs.push({
          id: `remix-${r.id}`,
          type: 'analysis',
          title: r.status === 'completed' ? 'Remix Ready' : 'Remix Processing',
          desc: `AI remix for "${r.original_title || 'your song'}" ${r.status === 'completed' ? 'is ready to play' : 'is being generated'}`,
          time: getRelativeTime(r.created_at),
          read: r.status === 'completed',
          icon: <Zap className="w-4 h-4 text-accent" />,
        });
      });

      // Add billing notification if user has subscription
      if (profile?.subscription_status === 'active' && profile?.plan_expires_at) {
        notifs.push({
          id: 'billing-renewal',
          type: 'billing',
          title: 'Subscription Active',
          desc: `Your ${profile.plan} plan renews on ${new Date(profile.plan_expires_at).toLocaleDateString()}`,
          time: '',
          read: true,
          icon: <CreditCard className="w-4 h-4 text-emerald-400" />,
        });
      }

      if (profile?.subscription_status === 'past_due') {
        notifs.push({
          id: 'billing-pastdue',
          type: 'billing',
          title: 'Payment Failed',
          desc: 'Your last payment failed. Please update your payment method.',
          time: '',
          read: false,
          icon: <CreditCard className="w-4 h-4 text-destructive" />,
        });
      }

      // System tip
      notifs.push({
        id: 'system-tip',
        type: 'system',
        title: 'Pro Tip',
        desc: 'Songs with hooks in the first 10 seconds perform 3x better on TikTok',
        time: '',
        read: true,
        icon: <Megaphone className="w-4 h-4 text-muted-foreground" />,
      });

      // Sort by recency (analyses/remixes have real times)
      notifs.sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return 0; // Already sorted by DB query
      });

      setNotifications(notifs);
      setLoading(false);
    };
    load();
  }, [user, profile]);

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
        {loading ? (
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => <div key={i} className="h-16 bg-muted/30 animate-pulse rounded-xl" />)}
          </div>
        ) : (
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
                  {n.time && <p className="text-[11px] text-muted-foreground/60 mt-1">{n.time}</p>}
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
        )}
      </div>
    </DashboardLayout>
  );
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
