import { useState, useEffect } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { supabase } from '@/lib/supabase';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, subMonths, addDays } from 'date-fns';
import { DollarSign, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

const glassCls = 'bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm';
const PLAN_COLORS: Record<string, string> = { free: '#6b7280', payg: '#f59e0b', pro: '#8b5cf6', studio: '#ec4899' };
const PLAN_PRICES: Record<string, number> = { free: 0, payg: 0, pro: 19, studio: 49 };

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded-lg ${className}`} />;
}

function StatCard({ label, value, sub, icon: Icon, accent = 'purple' }: any) {
  const accentMap: Record<string, string> = {
    purple: 'text-purple-400', gold: 'text-yellow-400', green: 'text-green-400', red: 'text-red-400'
  };
  return (
    <div className={glassCls}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest mb-1">{label}</p>
          <p className={`text-2xl font-bold ${accentMap[accent]}`}>{value}</p>
          {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
        </div>
        {Icon && <Icon className={`w-5 h-5 mt-1 ${accentMap[accent]}`} />}
      </div>
    </div>
  );
}

export default function AdminRevenue() {
  const [loading, setLoading] = useState(true);
  const [mrrData, setMrrData] = useState<any[]>([]);
  const [planRevData, setPlanRevData] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState<any[]>([]);
  const [totalMrr, setTotalMrr] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [creditPurchases, setCreditPurchases] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [{ data: users }, { data: credits }] = await Promise.all([
        supabase.from('viralize_users').select('*').order('created_at', { ascending: false }),
        supabase.from('viralize_credits').select('*, viralize_users(email)').order('created_at', { ascending: false }),
      ]);

      // MRR
      let mrr = 0;
      users?.forEach(u => { mrr += PLAN_PRICES[u.plan] ?? 0; });
      setTotalMrr(mrr);

      // Total revenue from credits table
      const total = credits?.reduce((acc, c) => acc + (c.amount ?? 0), 0) ?? 0;
      setTotalRevenue(total);

      // MRR over last 12 months (simulated from join dates + plans)
      const now = new Date();
      const mrrMonths: any[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const label = format(monthDate, 'MMM yy');
        // Users who were on paid plan by that month
        const usersAtTime = users?.filter(u => new Date(u.created_at) <= monthDate) ?? [];
        const mrrAtTime = usersAtTime.reduce((acc, u) => acc + (PLAN_PRICES[u.plan] ?? 0), 0);
        mrrMonths.push({ month: label, mrr: mrrAtTime });
      }
      setMrrData(mrrMonths);

      // Revenue by plan
      const planRev: Record<string, number> = { pro: 0, studio: 0, payg: 0 };
      users?.forEach(u => {
        if (PLAN_PRICES[u.plan]) planRev[u.plan] = (planRev[u.plan] ?? 0) + PLAN_PRICES[u.plan];
      });
      setPlanRevData(
        Object.entries(planRev)
          .filter(([, v]) => v > 0)
          .map(([name, value]) => ({ name, value }))
      );

      // Payment history
      setPayments((credits ?? []).slice(0, 50));

      // Credit purchases
      setCreditPurchases((credits ?? []).filter(c => c.type === 'purchase').slice(0, 20));

      // Upcoming renewals (users with subscription + plan_expires_at in next 30 days)
      const in30Days = addDays(now, 30);
      const renewals = users?.filter(u =>
        u.plan_expires_at && new Date(u.plan_expires_at) <= in30Days && new Date(u.plan_expires_at) >= now
      ) ?? [];
      setUpcomingRenewals(renewals);

      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Revenue</h1>
            <p className="text-xs text-white/40 mt-1">Financial overview</p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {loading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />) : <>
              <StatCard label="Current MRR" value={`$${totalMrr}`} icon={DollarSign} accent="purple" sub="Monthly recurring" />
              <StatCard label="All-Time Revenue" value={`$${totalRevenue}`} icon={TrendingUp} accent="gold" />
              <StatCard label="ARR (est.)" value={`$${totalMrr * 12}`} icon={DollarSign} accent="green" sub="MRR × 12" />
              <StatCard label="Upcoming Renewals" value={upcomingRenewals.length} icon={Clock} accent="purple" sub="Next 30 days" />
            </>}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className={`${glassCls} lg:col-span-2`}>
              <p className="text-sm font-medium text-white/80 mb-4">MRR Growth — Last 12 Months</p>
              {loading ? <Skeleton className="h-56" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={mrrData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: '#ffffff40', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} tickFormatter={v => `$${v}`} />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} formatter={(v: any) => [`$${v}`, 'MRR']} />
                    <Line type="monotone" dataKey="mrr" stroke="#8b5cf6" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className={glassCls}>
              <p className="text-sm font-medium text-white/80 mb-4">Revenue by Plan</p>
              {loading ? <Skeleton className="h-56" /> : (
                planRevData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={planRevData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {planRevData.map((entry, i) => (
                          <Cell key={i} fill={PLAN_COLORS[entry.name] ?? '#8b5cf6'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`$${v}`, 'MRR']} contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                      <Legend formatter={(val) => <span style={{ color: '#ffffff80', fontSize: 12 }}>{val}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48 text-white/30 text-sm">No paid plans yet</div>
                )
              )}
            </div>
          </div>

          {/* Payment History Table */}
          <div className={`${glassCls} mb-6`}>
            <p className="text-sm font-medium text-white/80 mb-4">Payment History</p>
            {loading ? <Skeleton className="h-48" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="pb-2 text-left text-xs text-white/40 font-medium">Date</th>
                      <th className="pb-2 text-left text-xs text-white/40 font-medium">User</th>
                      <th className="pb-2 text-left text-xs text-white/40 font-medium">Type</th>
                      <th className="pb-2 text-left text-xs text-white/40 font-medium">Amount</th>
                      <th className="pb-2 text-left text-xs text-white/40 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map((p: any, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="py-2 pr-4 text-white/40 text-xs">{format(new Date(p.created_at), 'MMM d, yyyy')}</td>
                        <td className="py-2 pr-4 text-white/70 text-xs truncate max-w-[180px]">
                          {p.viralize_users?.email ?? p.user_id?.slice(0, 8) + '...'}
                        </td>
                        <td className="py-2 pr-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/60 capitalize">
                            {p.type ?? 'credit'}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-yellow-400 font-medium">${p.amount ?? 0}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            p.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            {p.status ?? 'completed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-white/30 text-xs">No payment records yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upcoming Renewals */}
          {upcomingRenewals.length > 0 && (
            <div className={glassCls}>
              <p className="text-sm font-medium text-white/80 mb-4">
                <Clock className="w-4 h-4 inline mr-2 text-purple-400" />
                Upcoming Renewals (next 30 days)
              </p>
              <div className="space-y-2">
                {upcomingRenewals.map((u: any, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-sm text-white/70">{u.email}</span>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-xs" style={{ background: PLAN_COLORS[u.plan] + '25', color: PLAN_COLORS[u.plan] }}>{u.plan}</span>
                      <span className="text-xs text-white/40">{u.plan_expires_at ? format(new Date(u.plan_expires_at), 'MMM d') : ''}</span>
                      <span className="text-xs text-yellow-400">${PLAN_PRICES[u.plan]}/mo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
