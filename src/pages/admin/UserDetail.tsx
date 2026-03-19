import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, CreditCard, ChevronDown, Trash2, Music, BarChart3,
  Calendar, Coins, Activity, Clock, TrendingUp, Zap, User as UserIcon
} from 'lucide-react';
import { format, differenceInDays, isToday } from 'date-fns';
import { toast } from 'sonner';

const PLAN_COLORS: Record<string, string> = {
  free: '#6b7280', payg: '#f59e0b', pro: '#8b5cf6', studio: '#ec4899', business: '#3b82f6', unlimited: '#ef4444'
};
const PLANS = ['free', 'payg', 'pro', 'studio', 'business', 'unlimited'];

function StatCard({ icon: Icon, label, value, subtext, color = 'text-white/80' }: {
  icon: any; label: string; value: string | number; subtext?: string; color?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-white/30" />
        <p className="text-xs text-white/40">{label}</p>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {subtext && <p className="text-xs text-white/30 mt-1">{subtext}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, count, color }: {
  icon: any; title: string; count?: number; color: string;
}) {
  return (
    <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <h2 className="text-sm font-semibold text-white/70">{title}</h2>
      {count !== undefined && (
        <span className="ml-auto text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{count}</span>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="px-5 py-10 text-center text-white/30 text-sm">{message}</p>;
}

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [remixes, setRemixes] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [totalAnalyses, setTotalAnalyses] = useState(0);
  const [totalRemixes, setTotalRemixes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const fetchUser = async () => {
    if (!userId) return;
    setLoading(true);
    const [{ data: userData }, { data: analysesData }, { data: remixesData }, { data: creditsData }] = await Promise.all([
      supabase.from('viralize_users').select('*').eq('id', userId).single(),
      supabase.from('viralize_analyses').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      supabase.from('viralize_remixes').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      supabase.from('viralize_credits').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    ]);
    setUser(userData);
    setAnalyses(analysesData ?? []);
    setRemixes(remixesData ?? []);
    setCredits(creditsData ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchUser(); }, [userId]);

  const todayActivity = useMemo(() => {
    const analysesToday = analyses.filter(a => a.created_at && isToday(new Date(a.created_at))).length;
    const remixesToday = remixes.filter(r => r.created_at && isToday(new Date(r.created_at))).length;
    const creditsToday = credits.filter(c => c.created_at && isToday(new Date(c.created_at))).reduce((sum, c) => sum + (c.amount ?? 0), 0);
    return { analysesToday, remixesToday, creditsToday };
  }, [analyses, remixes, credits]);

  const daysSinceJoined = user?.created_at ? differenceInDays(new Date(), new Date(user.created_at)) : 0;

  const handleChangePlan = async (newPlan: string) => {
    const { error } = await supabase.from('viralize_users').update({ plan: newPlan }).eq('id', userId!);
    if (error) toast.error('Failed to change plan', { description: error.message });
    else { toast.success('Plan updated'); fetchUser(); }
    setChangingPlan(false);
  };

  const handleAddCredits = async () => {
    const amount = parseInt(creditAmount);
    if (!amount || isNaN(amount)) return;
    const { error } = await supabase.from('viralize_users').update({ credits: (user?.credits ?? 0) + amount }).eq('id', userId!);
    if (error) toast.error('Failed to add credits', { description: error.message });
    else { toast.success(`Added ${amount} credits`); fetchUser(); }
    setShowAddCredits(false);
    setCreditAmount('');
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('viralize_users').delete().eq('id', userId!);
    if (error) toast.error('Failed to delete user', { description: error.message });
    else { toast.success('User deleted'); navigate('/admin/users'); }
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="flex min-h-screen bg-[#0a0a0a] text-white">
          <AdminNav />
          <main className="flex-1 p-4 md:p-6 ml-0 md:ml-56">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-32 bg-white/10 rounded-lg" />
              <div className="h-36 bg-white/10 rounded-xl" />
              <div className="grid grid-cols-4 gap-4">
                {Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-white/10 rounded-xl" />)}
              </div>
              <div className="h-48 bg-white/10 rounded-xl" />
            </div>
          </main>
        </div>
      </AdminGuard>
    );
  }

  if (!user) {
    return (
      <AdminGuard>
        <div className="flex min-h-screen bg-[#0a0a0a] text-white">
          <AdminNav />
          <main className="flex-1 p-4 md:p-6 ml-0 md:ml-56 flex items-center justify-center">
            <div className="text-center">
              <UserIcon className="w-12 h-12 mx-auto mb-3 text-white/10" />
              <p className="text-white/40 mb-4">User not found</p>
              <button onClick={() => navigate('/admin/users')} className="text-purple-400 hover:text-purple-300 text-sm transition-colors">
                ← Back to Users
              </button>
            </div>
          </main>
        </div>
      </AdminGuard>
    );
  }

  const subscriptionActive = user.subscription_status === 'active';

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav />
        <main className="flex-1 overflow-auto p-4 md:p-6 ml-0 md:ml-56 space-y-6 max-w-5xl">
          {/* Back button */}
          <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Users
          </button>

          {/* ── 1. Profile Card ── */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex flex-wrap items-start gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-purple-600/30 border-2 border-purple-500/20 flex items-center justify-center text-2xl font-bold text-purple-300 flex-shrink-0">
                {user.email?.[0]?.toUpperCase() ?? '?'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <h1 className="text-xl font-bold text-white truncate">{user.email}</h1>
                {user.display_name && (
                  <p className="text-sm text-white/50">@{user.display_name}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {/* Plan badge */}
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                    style={{
                      background: (PLAN_COLORS[user.plan] ?? '#6b7280') + '20',
                      color: PLAN_COLORS[user.plan] ?? '#6b7280',
                      border: `1px solid ${(PLAN_COLORS[user.plan] ?? '#6b7280')}30`,
                    }}
                  >
                    {user.plan ?? 'free'}
                  </span>

                  {/* Status */}
                  <span className={`flex items-center gap-1.5 text-xs ${subscriptionActive ? 'text-emerald-400' : 'text-white/30'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${subscriptionActive ? 'bg-emerald-400' : 'bg-white/20'}`} />
                    {subscriptionActive ? 'Active' : user.subscription_status ?? 'No subscription'}
                  </span>

                  {/* Joined */}
                  <span className="flex items-center gap-1 text-xs text-white/30">
                    <Calendar className="w-3 h-3" />
                    Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Change plan */}
                <div className="relative">
                  <button
                    onClick={() => setChangingPlan(!changingPlan)}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/50 hover:text-white/70 hover:border-white/20 transition-colors flex items-center gap-1"
                  >
                    Change Plan <ChevronDown className="w-3 h-3" />
                  </button>
                  {changingPlan && (
                    <div className="absolute top-full right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden min-w-[120px]">
                      {PLANS.map(plan => (
                        <button
                          key={plan}
                          onClick={() => handleChangePlan(plan)}
                          className="block w-full text-left px-4 py-2 text-xs hover:bg-white/10 capitalize transition-colors"
                          style={{ color: PLAN_COLORS[plan] }}
                        >
                          {plan}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delete */}
                {deleteConfirm ? (
                  <div className="flex items-center gap-1.5">
                    <button onClick={handleDelete} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30 transition-colors">
                      Confirm
                    </button>
                    <button onClick={() => setDeleteConfirm(false)} className="px-3 py-1.5 bg-white/10 text-white/40 rounded-lg text-xs hover:bg-white/20 transition-colors">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(true)} className="p-2 text-white/30 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10" title="Delete user">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── 2. Stats Row ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={BarChart3} label="Total Analyses" value={user.analyses_used ?? 0} subtext={`${user.analyses_this_month ?? 0} this month`} color="text-purple-400" />
            <StatCard icon={Music} label="Total Remixes" value={user.remixes_used ?? 0} subtext={`${user.remixes_this_month ?? 0} this month`} color="text-pink-400" />
            <StatCard
              icon={Coins}
              label="Credits"
              value={user.credits ?? 0}
              color="text-yellow-400"
              subtext={
                showAddCredits ? undefined : 'Click + to add'
              }
            />
            <StatCard icon={Clock} label="Days Since Joined" value={daysSinceJoined} subtext={daysSinceJoined === 0 ? 'Joined today!' : undefined} color="text-blue-400" />
          </div>

          {/* Add credits inline */}
          <div className="flex items-center gap-3 -mt-2">
            {!showAddCredits ? (
              <button onClick={() => setShowAddCredits(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400 hover:bg-yellow-500/20 transition-colors">
                <CreditCard className="w-3.5 h-3.5" /> Add Credits
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <input
                  type="number"
                  value={creditAmount}
                  onChange={e => setCreditAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-24 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
                  autoFocus
                />
                <button onClick={handleAddCredits} className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30 transition-colors font-medium">
                  Add
                </button>
                <button onClick={() => { setShowAddCredits(false); setCreditAmount(''); }} className="px-2 py-1 text-white/30 text-xs hover:text-white/50 transition-colors">
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* ── 3. Today's Activity ── */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white/70">Today's Activity</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{todayActivity.analysesToday}</p>
                <p className="text-xs text-white/40 mt-1">Analyses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-pink-400">{todayActivity.remixesToday}</p>
                <p className="text-xs text-white/40 mt-1">Remixes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{todayActivity.creditsToday}</p>
                <p className="text-xs text-white/40 mt-1">Credits Used</p>
              </div>
            </div>
          </div>

          {/* ── 4. Recent Analyses ── */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <SectionHeader icon={BarChart3} title="Recent Analyses" count={analyses.length} color="text-purple-400" />
            {analyses.length === 0 ? (
              <EmptyState message="No analyses yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="px-5 py-2.5 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Title</th>
                      <th className="px-5 py-2.5 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Genre</th>
                      <th className="px-5 py-2.5 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Score</th>
                      <th className="px-5 py-2.5 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Verdict</th>
                      <th className="px-5 py-2.5 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {analyses.map(a => (
                      <tr key={a.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-3 text-white/70 truncate max-w-[200px]">{a.title ?? '—'}</td>
                        <td className="px-5 py-3 text-white/50 capitalize">{a.genre ?? '—'}</td>
                        <td className="px-5 py-3">
                          <span className="text-purple-400 font-semibold">{a.score ?? '—'}</span>
                        </td>
                        <td className="px-5 py-3 text-white/50 truncate max-w-[150px]">{a.verdict ?? '—'}</td>
                        <td className="px-5 py-3 text-white/30 text-xs">
                          {a.created_at ? format(new Date(a.created_at), 'MMM d, yyyy HH:mm') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── 5. Recent Remixes ── */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <SectionHeader icon={Music} title="Recent Remixes" count={remixes.length} color="text-pink-400" />
            {remixes.length === 0 ? (
              <EmptyState message="No remixes yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="px-5 py-2.5 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Remix Title</th>
                      <th className="px-5 py-2.5 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Original</th>
                      <th className="px-5 py-2.5 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Genre</th>
                      <th className="px-5 py-2.5 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Status</th>
                      <th className="px-5 py-2.5 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {remixes.map(r => (
                      <tr key={r.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-3 text-white/70 truncate max-w-[200px]">{r.remix_title ?? '—'}</td>
                        <td className="px-5 py-3 text-white/50 truncate max-w-[150px]">{r.original_title ?? '—'}</td>
                        <td className="px-5 py-3 text-white/50 capitalize">{r.genre ?? '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                            r.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            r.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-white/10 text-white/50'
                          }`}>
                            {r.status ?? '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-white/30 text-xs">
                          {r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy HH:mm') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── 6. Credit History ── */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <SectionHeader icon={Coins} title="Credit History" count={credits.length} color="text-yellow-400" />
            {credits.length === 0 ? (
              <EmptyState message="No credit transactions yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="px-5 py-2.5 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Amount</th>
                      <th className="px-5 py-2.5 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Type</th>
                      <th className="px-5 py-2.5 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Payment ID</th>
                      <th className="px-5 py-2.5 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {credits.map(c => (
                      <tr key={c.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-3">
                          <span className={`font-semibold ${(c.amount ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {(c.amount ?? 0) >= 0 ? '+' : ''}{c.amount ?? 0}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-white/50 capitalize">{c.type ?? '—'}</td>
                        <td className="px-5 py-3 text-white/30 text-xs font-mono truncate max-w-[180px]">
                          {c.stripe_payment_id ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-white/30 text-xs">
                          {c.created_at ? format(new Date(c.created_at), 'MMM d, yyyy HH:mm') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
