import { useState, useEffect } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { fetchAuditLogs } from '@/lib/adminAudit';
import { format } from 'date-fns';
import { Calendar, Filter, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  admin_email: string;
  action: string;
  target_table: string;
  target_id: string | null;
  changes: any;
  ip_address: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const ACTIONS = [
    'UPDATE_PLAN',
    'ADD_CREDITS',
    'DELETE_USER',
    'CREATE_IMPERSONATION_SESSION',
    'END_IMPERSONATION_SESSION',
    'UPDATE_SUPPORT_TICKET',
  ];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs(100);
      setLogs(data as AuditLog[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load logs';
      toast.error('Error loading logs', { description: msg });
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(log => {
    const matchSearch = !search ||
      log.admin_email?.toLowerCase().includes(search.toLowerCase()) ||
      log.target_id?.toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === 'all' || log.action === filterAction;
    const matchStatus = filterStatus === 'all' || log.status === filterStatus;
    return matchSearch && matchAction && matchStatus;
  });

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'UPDATE_PLAN': 'text-blue-400',
      'ADD_CREDITS': 'text-green-400',
      'DELETE_USER': 'text-red-400',
      'CREATE_IMPERSONATION_SESSION': 'text-purple-400',
      'END_IMPERSONATION_SESSION': 'text-purple-300',
      'UPDATE_SUPPORT_TICKET': 'text-yellow-400',
    };
    return colors[action] || 'text-white/60';
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'success': 'bg-green-500/20 text-green-400',
      'failed': 'bg-red-500/20 text-red-400',
      'pending': 'bg-yellow-500/20 text-yellow-400',
    };
    return colors[status] || 'bg-white/10 text-white/60';
  };

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav />
        <main className="flex-1 overflow-auto p-4 md:p-6 ml-0 md:ml-56">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
            <p className="text-xs text-white/40 mt-1">Track all admin actions and changes</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-0 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search admin email or user ID..."
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* Action Filter */}
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="all">All Actions</option>
              {ACTIONS.map(action => (
                <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={() => fetchLogs()}
              disabled={loading}
              className="px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg text-sm hover:bg-purple-600/30 transition-colors disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {/* Logs Table */}
          {loading ? (
            <div className="space-y-3">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-white/10 rounded-lg h-12" />
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Time</th>
                      <th className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Admin</th>
                      <th className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Action</th>
                      <th className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Target</th>
                      <th className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs text-white/40 font-medium uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        {/* Time */}
                        <td className="px-4 py-3 text-white/60 text-xs whitespace-nowrap">
                          {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                        </td>

                        {/* Admin Email */}
                        <td className="px-4 py-3 text-white/80 text-sm max-w-[150px] truncate">
                          {log.admin_email || 'System'}
                        </td>

                        {/* Action */}
                        <td className={`px-4 py-3 text-sm font-medium ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </td>

                        {/* Target */}
                        <td className="px-4 py-3 text-white/60 text-xs max-w-[200px] truncate">
                          {log.target_table} {log.target_id && `(${log.target_id.slice(0, 8)}...)`}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadge(log.status)}`}>
                            {log.status}
                          </span>
                        </td>

                        {/* Details */}
                        <td className="px-4 py-3 text-white/60 text-xs max-w-xs">
                          {log.error_message ? (
                            <span className="text-red-400">{log.error_message.slice(0, 50)}...</span>
                          ) : log.changes ? (
                            <span className="text-white/40">{JSON.stringify(log.changes).slice(0, 50)}...</span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-white/30">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          No logs found
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
