import { useState, useEffect } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { supabase } from '@/lib/supabase';
import { validatePlan, validateCredits, updateUserPlanSchema, addCreditsSchema } from '@/lib/validation';
import { logAdminAction, createImpersonationSession } from '@/lib/adminAudit';
import { Search, Trash2, CreditCard, ChevronDown, AlertCircle, LogIn } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const PLAN_COLORS: Record<string, string> = {
  free: '#6b7280', payg: '#f59e0b', pro: '#8b5cf6', studio: '#ec4899'
};

const PLANS = ['free', 'payg', 'pro', 'studio'];

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded-lg ${className}`} />;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [addCreditsUser, setAddCreditsUser] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [impersonatingUser, setImpersonatingUser] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('viralize_users')
        .select('*')
        .order('created_at', { ascending: false })
        .throwOnError();

      if (error) {
        toast.error('Failed to load users', { description: error.message });
        setUsers([]);
      } else {
        setUsers(data ?? []);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load users';
      toast.error('Error loading users', { description: msg });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (userId: string, userEmail: string) => {
    try {
      const { sessionToken, expiresAt } = await createImpersonationSession(
        userId,
        `Admin support session for ${userEmail}`
      );

      // Store token in session storage (not localStorage for security)
      sessionStorage.setItem('adminImpersonationToken', sessionToken);
      sessionStorage.setItem('adminImpersonationExpires', expiresAt);

      toast.success('Impersonation session created', {
        description: `You are now viewing as ${userEmail}. Session expires in 30 minutes.`,
      });

      // Redirect to home or dashboard with the impersonation token
      window.location.href = `/?impersonation_token=${sessionToken}`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create impersonation session';
      toast.error('Impersonation failed', { description: msg });
    } finally {
      setImpersonatingUser(null);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchPlan = filterPlan === 'all' || u.plan === filterPlan;
    return matchSearch && matchPlan;
  });

  const handleChangePlan = async (userId: string, newPlan: string) => {
    try {
      const user = users.find(u => u.id === userId);
      const oldPlan = user?.plan;

      // Validate input
      const validation = updateUserPlanSchema.safeParse({ userId, newPlan });
      if (!validation.success) {
        const errorMsg = validation.error.errors[0]?.message || 'Invalid input';
        toast.error('Validation error', { description: errorMsg });
        return;
      }

      const { error } = await supabase
        .from('viralize_users')
        .update({ plan: newPlan })
        .eq('id', userId)
        .throwOnError();

      if (error) {
        await logAdminAction({
          action: 'UPDATE_PLAN',
          targetTable: 'viralize_users',
          targetId: userId,
          changes: { before: oldPlan, after: newPlan },
          status: 'failed',
          errorMessage: error.message,
        });
        toast.error('Failed to change plan', { description: error.message });
        if (import.meta.env.DEV) console.error('Plan change error:', error);
      } else {
        await logAdminAction({
          action: 'UPDATE_PLAN',
          targetTable: 'viralize_users',
          targetId: userId,
          changes: { before: oldPlan, after: newPlan },
          status: 'success',
        });
        toast.success('Plan updated successfully');
        fetchUsers();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update plan';
      await logAdminAction({
        action: 'UPDATE_PLAN',
        targetTable: 'viralize_users',
        targetId: userId,
        status: 'failed',
        errorMessage: errorMsg,
      });
      toast.error('System error', { description: errorMsg });
      if (import.meta.env.DEV) console.error('Unexpected error:', err);
    } finally {
      setChangingPlan(null);
    }
  };

  const handleAddCredits = async (userId: string) => {
    try {
      const amount = parseInt(creditAmount, 10);

      // Validate input
      const validation = addCreditsSchema.safeParse({ userId, amount });
      if (!validation.success) {
        const errorMsg = validation.error.errors[0]?.message || 'Invalid input';
        toast.error('Validation error', { description: errorMsg });
        return;
      }

      const user = users.find(u => u.id === userId);
      if (!user) {
        toast.error('User not found');
        return;
      }

      const oldCredits = user.credits ?? 0;
      const newCredits = oldCredits + amount;

      const { error } = await supabase
        .from('viralize_users')
        .update({ credits: newCredits })
        .eq('id', userId)
        .throwOnError();

      if (error) {
        await logAdminAction({
          action: 'ADD_CREDITS',
          targetTable: 'viralize_users',
          targetId: userId,
          changes: { before: oldCredits, after: newCredits, amount },
          status: 'failed',
          errorMessage: error.message,
        });
        toast.error('Failed to add credits', { description: error.message });
        if (import.meta.env.DEV) console.error('Credits error:', error);
      } else {
        await logAdminAction({
          action: 'ADD_CREDITS',
          targetTable: 'viralize_users',
          targetId: userId,
          changes: { before: oldCredits, after: newCredits, amount },
          status: 'success',
        });
        toast.success(`Added ${amount} credits`);
        fetchUsers();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add credits';
      await logAdminAction({
        action: 'ADD_CREDITS',
        targetTable: 'viralize_users',
        targetId: userId,
        status: 'failed',
        errorMessage: errorMsg,
      });
      toast.error('System error', { description: errorMsg });
      if (import.meta.env.DEV) console.error('Unexpected error:', err);
    } finally {
      setAddCreditsUser(null);
      setCreditAmount('');
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      if (!userId || userId.length === 0) {
        toast.error('Invalid user ID');
        return;
      }

      const user = users.find(u => u.id === userId);

      const { error } = await supabase
        .from('viralize_users')
        .delete()
        .eq('id', userId)
        .throwOnError();

      if (error) {
        await logAdminAction({
          action: 'DELETE_USER',
          targetTable: 'viralize_users',
          targetId: userId,
          changes: { email: user?.email },
          status: 'failed',
          errorMessage: error.message,
        });
        toast.error('Failed to delete user', { description: error.message });
        if (import.meta.env.DEV) console.error('Delete error:', error);
      } else {
        await logAdminAction({
          action: 'DELETE_USER',
          targetTable: 'viralize_users',
          targetId: userId,
          changes: { email: user?.email },
          status: 'success',
        });
        toast.success('User deleted successfully');
        fetchUsers();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete user';
      await logAdminAction({
        action: 'DELETE_USER',
        targetTable: 'viralize_users',
        targetId: userId,
        status: 'failed',
        errorMessage: errorMsg,
      });
      toast.error('System error', { description: errorMsg });
      if (import.meta.env.DEV) console.error('Unexpected error:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav />
        <main className="flex-1 overflow-auto p-4 md:p-6 ml-0 md:ml-56">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Users</h1>
              <p className="text-xs text-white/40 mt-1">{users.length} total users</p>
            </div>
            <div className="flex-1 min-w-0 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by email..."
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>
            {/* Plan filters */}
            <div className="flex gap-2">
              {['all', ...PLANS].map(plan => (
                <button
                  key={plan}
                  onClick={() => setFilterPlan(plan)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                    filterPlan === plan
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                      : 'text-white/50 hover:text-white border border-transparent hover:border-white/10'
                  }`}
                >
                  {plan}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-3">
              {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Plan</th>
                      <th className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Analyses</th>
                      <th className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Remixes</th>
                      <th className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Credits</th>
                      <th className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Joined</th>
                      <th className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        {/* Avatar + Email */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">
                              {u.email?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white/80 truncate max-w-[180px]">{u.email}</p>
                              {u.display_name && <p className="text-xs text-white/40 truncate">{u.display_name}</p>}
                            </div>
                          </div>
                        </td>
                        {/* Plan */}
                        <td className="px-4 py-3">
                          <div className="relative">
                            <button
                              onClick={() => setChangingPlan(changingPlan === u.id ? null : u.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                              style={{ background: PLAN_COLORS[u.plan] + '25', color: PLAN_COLORS[u.plan] }}
                            >
                              {u.plan}
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            {changingPlan === u.id && (
                              <div className="absolute top-full left-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden">
                                {PLANS.map(plan => (
                                  <button
                                    key={plan}
                                    onClick={() => handleChangePlan(u.id, plan)}
                                    className="block w-full text-left px-4 py-2 text-xs hover:bg-white/10 capitalize transition-colors"
                                    style={{ color: PLAN_COLORS[plan] }}
                                  >
                                    {plan}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        {/* Analyses */}
                        <td className="px-4 py-3 text-white/60">
                          {u.analyses_used ?? 0}
                        </td>
                        {/* Remixes */}
                        <td className="px-4 py-3 text-white/60">
                          {u.remixes_used ?? 0}
                        </td>
                        {/* Credits */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400">{u.credits ?? 0}</span>
                            <button
                              onClick={() => setAddCreditsUser(addCreditsUser === u.id ? null : u.id)}
                              className="text-white/30 hover:text-yellow-400 transition-colors"
                              title="Add credits"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {addCreditsUser === u.id && (
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="number"
                                value={creditAmount}
                                onChange={e => setCreditAmount(e.target.value)}
                                placeholder="Amount"
                                className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white focus:outline-none focus:border-yellow-400/50"
                              />
                              <button
                                onClick={() => handleAddCredits(u.id)}
                                className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30 transition-colors"
                              >
                                Add
                              </button>
                            </div>
                          )}
                        </td>
                        {/* Joined */}
                        <td className="px-4 py-3 text-white/40 text-xs">
                          {format(new Date(u.created_at), 'MMM d, yyyy')}
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {deleteConfirm === u.id ? (
                              <>
                                <button
                                  onClick={() => handleDelete(u.id)}
                                  className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-2 py-1 bg-white/10 text-white/40 rounded text-xs hover:bg-white/20 transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleImpersonate(u.id, u.email)}
                                  className="p-1.5 text-white/30 hover:text-blue-400 transition-colors rounded hover:bg-blue-400/10"
                                  title={`Impersonate ${u.email}`}
                                >
                                  <LogIn className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(u.id)}
                                  className="p-1.5 text-white/30 hover:text-red-400 transition-colors rounded hover:bg-red-400/10"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-white/30">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
