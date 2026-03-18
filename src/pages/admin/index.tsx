import { useState, useEffect, useCallback } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { supabase } from '@/lib/supabase';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { RefreshCw, TrendingUp, Users, Music, DollarSign, Activity, Zap } from 'lucide-react';
import { format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';

const PLAN_PRICES: Record<string, number> = { free: 0, payg: 0, pro: 19, studio: 49 };
const PLAN_COLORS: Record<string, string> = {
  free: '#6b7280', payg: '#f59e0b', pro: '#8b5cf6', studio: '#ec4899'
};

const glassCls = 'bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm';

// ─── Small helpers ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, accent = 'purple' }: {
  label: string; value: string | number; sub?: string; icon?: any; accent?: string;
}) {
  const accentMap: Record<string, string> = {
    purple: 'text-purple-400', gold: 'text-yellow-400', green: 'text-green-400', red: 'text-red-400'
  };
  return (
    <div className={glassCls}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest mb-1">{label}</p>
          <p className={`text-2xl font-bold ${accentMap[accent] ?? 'text-white'}`}>{value}</p>
          {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
        </div>
        {Icon && <Icon className={`w-5 h-5 mt-1 ${accentMap[accent] ?? 'text-white/40'}`} />}
      </div>
    </div>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded-lg ${className}`} />;
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    mrr: 0, totalRevenue: 0, newMrr: 0, churnRate: 0,
    totalUsers: 0, activeThisWeek: 0, newToday: 0, newThisWeek: 0, newThisMonth: 0,
    freeCount: 0, paidCount: 0,
    totalAnalyses: 0, totalRemixes: 0, avgScore: 0, topGenre: 'N/A',
  });

  // Chart data
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [analysesPerDay, setAnalysesPerDay] = useState<any[]>([]);
  const [planBreakdown, setPlanBreakdown] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [sortCol, setSortCol] = useState<string>('revenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // --- Users ---
      const { data: users } = await supabase
        .from('viralize_users')
        .select('*')
        .order('created_at', { ascending: false });

      const now = new Date();
      const weekAgo = subDays(now, 7);
      const monthAgo = subMonths(now, 1);
      const todayStart = startOfDay(now);

      const totalUsers = users?.length ?? 0;
      const newToday = users?.filter(u => new Date(u.created_at) >= todayStart).length ?? 0;
      const newThisWeek = users?.filter(u => new Date(u.created_at) >= weekAgo).length ?? 0;
      const newThisMonth = users?.filter(u => new Date(u.created_at) >= monthAgo).length ?? 0;
      const freeCount = users?.filter(u => u.plan === 'free').length ?? 0;
      const paidCount = totalUsers - freeCount;

      // MRR
      let mrr = 0;
      users?.forEach(u => { mrr += PLAN_PRICES[u.plan] ?? 0; });
      const newMrr = users
        ?.filter(u => new Date(u.created_at) >= monthAgo && u.plan !== 'free')
        .reduce((acc, u) => acc + (PLAN_PRICES[u.plan] ?? 0), 0) ?? 0;

      // --- Credits / Revenue ---
      const { data: credits } = await supabase
        .from('viralize_credits')
        .select('*')
        .order('created_at', { ascending: false });

      const totalRevenue = credits?.reduce((acc, c) => acc + (c.amount ?? 0), 0) ?? 0;

      // --- Analyses ---
      const { data: analyses } = await supabase
        .from('viralize_analyses')
        .select('*')
        .order('created_at', { ascending: false });

      const totalAnalyses = analyses?.length ?? 0;
      const scores = analyses?.map(a => a.score).filter(Boolean) ?? [];
      const avgScore = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

      // Genre count
      const genreCounts: Record<string, number> = {};
      analyses?.forEach(a => {
        if (a.genre) genreCounts[a.genre] = (genreCounts[a.genre] ?? 0) + 1;
      });
      const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

      // Active this week
      const userActivity: Record<string, boolean> = {};
      analyses?.filter(a => new Date(a.created_at) >= weekAgo).forEach(a => {
        if (a.user_id) userActivity[a.user_id] = true;
      });
      const activeThisWeek = Object.keys(userActivity).length;

      // --- Remixes ---
      const { data: remixes } = await supabase
        .from('viralize_remixes')
        .select('*')
        .order('created_at', { ascending: false });
      const totalRemixes = remixes?.length ?? 0;

      setStats({
        mrr, totalRevenue, newMrr, churnRate: 0,
        totalUsers, activeThisWeek, newToday, newThisWeek, newThisMonth,
        freeCount, paidCount,
        totalAnalyses, totalRemixes, avgScore, topGenre,
      });

      // --- User growth (last 30 days) ---
      const growthMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        growthMap[format(subDays(now, i), 'MMM d')] = 0;
      }
      users?.forEach(u => {
        const d = format(new Date(u.created_at), 'MMM d');
        if (growthMap[d] !== undefined) growthMap[d]++;
      });
      // Cumulative
      let cum = 0;
      const growth = Object.entries(growthMap).map(([date, count]) => {
        cum += count;
        return { date, users: cum, new: count };
      });
      setGrowthData(growth);

      // --- Revenue last 12 months ---
      const revMap: Record<string, number> = {};
      for (let i = 11; i >= 0; i--) {
        revMap[format(subMonths(now, i), 'MMM yy')] = 0;
      }
      credits?.forEach(c => {
        const k = format(new Date(c.created_at), 'MMM yy');
        if (revMap[k] !== undefined) revMap[k] += c.amount ?? 0;
      });
      setRevenueData(Object.entries(revMap).map(([month, revenue]) => ({ month, revenue })));

      // --- Analyses per day (last 7 days) ---
      const apdMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        apdMap[format(subDays(now, i), 'EEE')] = 0;
      }
      analyses?.forEach(a => {
        const d = format(new Date(a.created_at), 'EEE');
        if (apdMap[d] !== undefined) apdMap[d]++;
      });
      setAnalysesPerDay(Object.entries(apdMap).map(([day, count]) => ({ day, count })));

      // --- Plan breakdown ---
      const planMap: Record<string, number> = { free: 0, payg: 0, pro: 0, studio: 0 };
      users?.forEach(u => { planMap[u.plan] = (planMap[u.plan] ?? 0) + 1; });
      setPlanBreakdown(Object.entries(planMap).map(([name, value]) => ({ name, value })));

      // --- Activity feed ---
      const feed: any[] = [];
      users?.slice(0, 5).forEach(u => {
        feed.push({ type: 'signup', email: u.email, time: u.created_at, icon: '👤' });
      });
      analyses?.slice(0, 5).forEach(a => {
        const user = users?.find(u => u.id === a.user_id);
        feed.push({ type: 'analysis', email: user?.email ?? 'unknown', time: a.created_at, icon: '🎵' });
      });
      remixes?.slice(0, 3).forEach(r => {
        const user = users?.find(u => u.id === r.user_id);
        feed.push({ type: 'remix', email: user?.email ?? 'unknown', time: r.created_at, icon: '🎛️' });
      });
      feed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivityFeed(feed.slice(0, 15));

      // --- Top users ---
      const userMap: Record<string, any> = {};
      users?.forEach(u => {
        userMap[u.id] = {
          id: u.id,
          email: u.email,
          plan: u.plan,
          joined: u.created_at,
          analyses: 0,
          remixes: 0,
          revenue: 0,
        };
      });
      analyses?.forEach(a => {
        if (userMap[a.user_id]) userMap[a.user_id].analyses++;
      });
      remixes?.forEach(r => {
        if (userMap[r.user_id]) userMap[r.user_id].remixes++;
      });
      credits?.forEach(c => {
        if (c.user_id && userMap[c.user_id]) userMap[c.user_id].revenue += c.amount ?? 0;
      });
      const top = Object.values(userMap)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 20);
      setTopUsers(top);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Sorted top users
  const sortedUsers = [...topUsers].sort((a: any, b: any) => {
    const av = a[sortCol] ?? 0;
    const bv = b[sortCol] ?? 0;
    if (sortDir === 'asc') return av > bv ? 1 : -1;
    return av < bv ? 1 : -1;
  });

  const handleSort = (col: string) => {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 ml-0 md:ml-56">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 border border-white/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-xs text-white/40 mt-1">
                  Last updated: {format(lastUpdated, 'HH:mm:ss')}
                </p>
              </div>
            </div>
            <button
              onClick={fetchAll}
              className="flex items-center gap-2 text-sm text-white/60 hover:text-white border border-white/10 rounded-lg px-3 py-2 hover:bg-white/5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* KPI Row 1: Revenue */}
          <p className="text-xs uppercase tracking-widest text-white/40 mb-3">💰 Revenue</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {loading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />) : <>
              <StatCard label="Total MRR" value={`$${stats.mrr.toLocaleString()}`} icon={DollarSign} accent="purple" sub="Monthly recurring" />
              <StatCard label="All-Time Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={TrendingUp} accent="gold" />
              <StatCard label="New MRR This Month" value={`$${stats.newMrr.toLocaleString()}`} icon={Zap} accent="green" />
              <StatCard label="Churn Rate" value={`${stats.churnRate}%`} icon={Activity} accent="red" sub="Est. monthly" />
            </>}
          </div>

          {/* KPI Row 2: Users */}
          <p className="text-xs uppercase tracking-widest text-white/40 mb-3">👥 Users</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {loading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />) : <>
              <StatCard label="Total Users" value={stats.totalUsers} icon={Users} accent="purple" />
              <StatCard label="Active This Week" value={stats.activeThisWeek} icon={Activity} accent="green" />
              <div className={glassCls}>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">New Users</p>
                <div className="flex gap-4 mt-1">
                  <div><p className="text-xl font-bold text-purple-400">{stats.newToday}</p><p className="text-[10px] text-white/40">Today</p></div>
                  <div><p className="text-xl font-bold text-purple-300">{stats.newThisWeek}</p><p className="text-[10px] text-white/40">Week</p></div>
                  <div><p className="text-xl font-bold text-purple-200">{stats.newThisMonth}</p><p className="text-[10px] text-white/40">Month</p></div>
                </div>
              </div>
              <div className={glassCls}>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Free vs Paid</p>
                <div className="flex items-center gap-2">
                  <ResponsiveContainer width={70} height={70}>
                    <PieChart>
                      <Pie data={[{value: stats.freeCount},{value: stats.paidCount}]} cx={30} cy={30} innerRadius={20} outerRadius={32} dataKey="value">
                        <Cell fill="#6b7280" />
                        <Cell fill="#8b5cf6" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div>
                    <p className="text-[11px] text-gray-400">Free: {stats.freeCount}</p>
                    <p className="text-[11px] text-purple-400">Paid: {stats.paidCount}</p>
                  </div>
                </div>
              </div>
            </>}
          </div>

          {/* KPI Row 3: Product */}
          <p className="text-xs uppercase tracking-widest text-white/40 mb-3">🎵 Product</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {loading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />) : <>
              <StatCard label="Total Analyses" value={stats.totalAnalyses.toLocaleString()} icon={Music} accent="purple" />
              <StatCard label="Total Remixes" value={stats.totalRemixes.toLocaleString()} accent="gold" />
              <StatCard label="Avg Score" value={`${stats.avgScore}/100`} accent="green" sub="All-time average" />
              <StatCard label="Top Genre" value={stats.topGenre} accent="purple" sub="Most analyzed" />
            </>}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {/* User Growth */}
            <div className={`${glassCls} xl:col-span-2`}>
              <p className="text-sm font-medium text-white/80 mb-4">User Growth — Last 30 Days</p>
              {loading ? <Skeleton className="h-48" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#ffffff40', fontSize: 10 }} interval={6} />
                    <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Total Users" />
                    <Line type="monotone" dataKey="new" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="New/Day" strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Plan Breakdown */}
            <div className={glassCls}>
              <p className="text-sm font-medium text-white/80 mb-4">Plan Breakdown</p>
              {loading ? <Skeleton className="h-48" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={planBreakdown} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {planBreakdown.map((entry, index) => (
                        <Cell key={index} fill={PLAN_COLORS[entry.name] ?? '#8b5cf6'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Legend formatter={(val) => <span style={{ color: '#ffffff80', fontSize: 12 }}>{val}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Revenue Over Time */}
            <div className={`${glassCls} xl:col-span-2`}>
              <p className="text-sm font-medium text-white/80 mb-4">Revenue — Last 12 Months</p>
              {loading ? <Skeleton className="h-48" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: '#ffffff40', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} formatter={(v: any) => [`$${v}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Analyses per Day */}
            <div className={glassCls}>
              <p className="text-sm font-medium text-white/80 mb-4">Analyses — Last 7 Days</p>
              {loading ? <Skeleton className="h-48" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analysesPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" tick={{ fill: '#ffffff40', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#ffffff40', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Analyses" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Bottom Row: Activity Feed + Top Users */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Feed */}
            <div className={glassCls}>
              <p className="text-sm font-medium text-white/80 mb-4">Recent Activity</p>
              {loading ? <Skeleton className="h-64" /> : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {activityFeed.length === 0 && <p className="text-xs text-white/30">No activity yet</p>}
                  {activityFeed.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-sm flex-shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-white/80 truncate">{item.email}</p>
                        <p className="text-[10px] text-white/40 capitalize">{item.type} · {format(new Date(item.time), 'MMM d HH:mm')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Users Table */}
            <div className={`${glassCls} lg:col-span-2`}>
              <p className="text-sm font-medium text-white/80 mb-4">Top Users</p>
              {loading ? <Skeleton className="h-64" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10">
                        {[
                          { col: 'email', label: 'Email' },
                          { col: 'plan', label: 'Plan' },
                          { col: 'analyses', label: 'Analyses' },
                          { col: 'remixes', label: 'Remixes' },
                          { col: 'revenue', label: 'Revenue' },
                          { col: 'joined', label: 'Joined' },
                        ].map(({ col, label }) => (
                          <th
                            key={col}
                            onClick={() => handleSort(col)}
                            className="pb-2 text-left text-white/40 cursor-pointer hover:text-white/70 select-none"
                          >
                            {label} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                          </th>
                        ))}
                        <th className="pb-2 text-left text-white/40">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUsers.map((u: any) => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-2 pr-2 text-white/80 max-w-[140px] truncate">{u.email}</td>
                          <td className="py-2 pr-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                              style={{ background: PLAN_COLORS[u.plan] + '30', color: PLAN_COLORS[u.plan] }}>
                              {u.plan}
                            </span>
                          </td>
                          <td className="py-2 pr-2 text-white/60">{u.analyses}</td>
                          <td className="py-2 pr-2 text-white/60">{u.remixes}</td>
                          <td className="py-2 pr-2 text-yellow-400">${u.revenue}</td>
                          <td className="py-2 pr-2 text-white/40">{format(new Date(u.joined), 'MMM d yy')}</td>
                          <td className="py-2">
                            <div className="flex gap-1">
                              <a href={`/admin/users?id=${u.id}`} className="px-2 py-1 rounded bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 text-[10px] transition-colors">
                                View
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {sortedUsers.length === 0 && (
                        <tr><td colSpan={7} className="py-4 text-center text-white/30">No users yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
