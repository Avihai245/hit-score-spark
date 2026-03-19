import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CreditCard, ChevronDown, Trash2, Music, BarChart3, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const PLAN_COLORS: Record<string, string> = {
  free: '#6b7280', payg: '#f59e0b', pro: '#8b5cf6', studio: '#ec4899'
};
const PLANS = ['free', 'payg', 'pro', 'studio'];

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [remixes, setRemixes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const fetchUser = async () => {
    if (!userId) return;
    setLoading(true);
    const [{ data: userData }, { data: analysesData }, { data: remixesData }] = await Promise.all([
      supabase.from('viralize_users').select('*').eq('id', userId).single(),
      supabase.from('viralize_analyses').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('viralize_remixes').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);
    setUser(userData);
    setAnalyses(analysesData ?? []);
    setRemixes(remixesData ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchUser(); }, [userId]);

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
              <div className="h-8 w-48 bg-white/10 rounded-lg" />
              <div className="h-40 bg-white/10 rounded-xl" />
              <div className="h-60 bg-white/10 rounded-xl" />
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
              <p className="text-white/40 mb-4">User not found</p>
              <button onClick={() => navigate('/admin/users')} className="text-purple-400 hover:text-purple-300 text-sm">← Back to Users</button>
            </div>
          </main>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav />
        <main className="flex-1 overflow-auto p-4 md:p-6 ml-0 md:ml-56 space-y-6">
          {/* Back button */}
          <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Users
          </button>

          {/* User header */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex flex-wrap items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-purple-600/30 border border-purple-500/20 flex items-center justify-center text-xl font-bold text-purple-300 flex-shrink-0">
                {user.email?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white truncate">{user.email}</h1>
                {user.display_name && <p className="text-sm text-white/40">{user.display_name}</p>}
                <p className="text-xs text-white/30 mt-1">Joined {format(new Date(user.created_at), 'MMM d, yyyy')}</p>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2">
                {deleteConfirm ? (
                  <>
                    <button onClick={handleDelete} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30 transition-colors">Confirm Delete</button>
                    <button onClick={() => setDeleteConfirm(false)} className="px-3 py-1.5 bg-white/10 text-white/40 rounded-lg text-xs hover:bg-white/20 transition-colors">Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setDeleteConfirm(true)} className="p-2 text-white/30 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10" title="Delete user">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Plan */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative">
              <p className="text-xs text-white/40 mb-1">Plan</p>
              <button onClick={() => setChangingPlan(!changingPlan)} className="flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium capitalize" style={{ background: (PLAN_COLORS[user.plan] ?? '#6b7280') + '25', color: PLAN_COLORS[user.plan] ?? '#6b7280' }}>
                {user.plan ?? 'free'} <ChevronDown className="w-3 h-3" />
              </button>
              {changingPlan && (
                <div className="absolute top-full left-4 mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden">
                  {PLANS.map(plan => (
                    <button key={plan} onClick={() => handleChangePlan(plan)} className="block w-full text-left px-4 py-2 text-xs hover:bg-white/10 capitalize transition-colors" style={{ color: PLAN_COLORS[plan] }}>
                      {plan}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Credits */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Credits</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-yellow-400">{user.credits ?? 0}</span>
                <button onClick={() => setShowAddCredits(!showAddCredits)} className="text-white/30 hover:text-yellow-400 transition-colors" title="Add credits">
                  <CreditCard className="w-4 h-4" />
                </button>
              </div>
              {showAddCredits && (
                <div className="flex items-center gap-2 mt-2">
                  <input type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="Amount" className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50" />
                  <button onClick={handleAddCredits} className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30 transition-colors">Add</button>
                </div>
              )}
            </div>
            {/* Analyses */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Analyses</p>
              <p className="text-lg font-bold text-white/80">{user.analyses_used ?? 0}</p>
              <p className="text-xs text-white/30">This month: {user.analyses_this_month ?? 0}</p>
            </div>
            {/* Remixes */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Remixes</p>
              <p className="text-lg font-bold text-white/80">{user.remixes_used ?? 0}</p>
              <p className="text-xs text-white/30">This month: {user.remixes_this_month ?? 0}</p>
            </div>
          </div>

          {/* Analyses table */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-medium text-white/70">Analyses ({analyses.length})</h2>
            </div>
            {analyses.length === 0 ? (
              <p className="px-4 py-8 text-center text-white/30 text-sm">No analyses yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-4 py-2 text-left text-xs text-white/40 font-medium">Title</th>
                      <th className="px-4 py-2 text-left text-xs text-white/40 font-medium">Genre</th>
                      <th className="px-4 py-2 text-left text-xs text-white/40 font-medium">Score</th>
                      <th className="px-4 py-2 text-left text-xs text-white/40 font-medium">Verdict</th>
                      <th className="px-4 py-2 text-left text-xs text-white/40 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {analyses.map(a => (
                      <tr key={a.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2 text-white/70 truncate max-w-[200px]">{a.title ?? '—'}</td>
                        <td className="px-4 py-2 text-white/50 capitalize">{a.genre ?? '—'}</td>
                        <td className="px-4 py-2 text-purple-400 font-medium">{a.score ?? '—'}</td>
                        <td className="px-4 py-2 text-white/50 truncate max-w-[150px]">{a.verdict ?? '—'}</td>
                        <td className="px-4 py-2 text-white/30 text-xs">{a.created_at ? format(new Date(a.created_at), 'MMM d, yyyy') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Remixes table */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <Music className="w-4 h-4 text-pink-400" />
              <h2 className="text-sm font-medium text-white/70">Remixes ({remixes.length})</h2>
            </div>
            {remixes.length === 0 ? (
              <p className="px-4 py-8 text-center text-white/30 text-sm">No remixes yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-4 py-2 text-left text-xs text-white/40 font-medium">Remix Title</th>
                      <th className="px-4 py-2 text-left text-xs text-white/40 font-medium">Original</th>
                      <th className="px-4 py-2 text-left text-xs text-white/40 font-medium">Genre</th>
                      <th className="px-4 py-2 text-left text-xs text-white/40 font-medium">Status</th>
                      <th className="px-4 py-2 text-left text-xs text-white/40 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {remixes.map(r => (
                      <tr key={r.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2 text-white/70 truncate max-w-[200px]">{r.remix_title ?? '—'}</td>
                        <td className="px-4 py-2 text-white/50 truncate max-w-[150px]">{r.original_title ?? '—'}</td>
                        <td className="px-4 py-2 text-white/50 capitalize">{r.genre ?? '—'}</td>
                        <td className="px-4 py-2 text-white/50 capitalize">{r.status ?? '—'}</td>
                        <td className="px-4 py-2 text-white/30 text-xs">{r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : '—'}</td>
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
