import { useState, useEffect, useCallback } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Shield, Users, Eye, Settings, DollarSign, MessageSquare, BarChart3, ScrollText, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: string[];
}

const PERMISSION_MAP: Record<string, { icon: React.ReactNode; label: string }> = {
  'admin.all': { icon: <Shield className="w-3.5 h-3.5" />, label: 'Full Access' },
  'users.read': { icon: <Eye className="w-3.5 h-3.5" />, label: 'Users (Read)' },
  'users.write': { icon: <Users className="w-3.5 h-3.5" />, label: 'Users (Write)' },
  'users.delete': { icon: <Users className="w-3.5 h-3.5" />, label: 'Users (Delete)' },
  'content.read': { icon: <Settings className="w-3.5 h-3.5" />, label: 'Content (Read)' },
  'content.write': { icon: <Settings className="w-3.5 h-3.5" />, label: 'Content (Write)' },
  'support.read': { icon: <MessageSquare className="w-3.5 h-3.5" />, label: 'Support (Read)' },
  'support.write': { icon: <MessageSquare className="w-3.5 h-3.5" />, label: 'Support (Write)' },
  'analytics.read': { icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'Analytics' },
  'billing.read': { icon: <DollarSign className="w-3.5 h-3.5" />, label: 'Billing (Read)' },
  'billing.write': { icon: <DollarSign className="w-3.5 h-3.5" />, label: 'Billing (Write)' },
};

// Fallback roles for when table doesn't exist yet
const FALLBACK_ROLES: Role[] = [
  { id: '1', name: 'Super Admin', description: 'Full platform access', is_system: true, permissions: ['admin.all'] },
  { id: '2', name: 'Admin', description: 'Manage users, content, support', is_system: true, permissions: ['users.read', 'users.write', 'content.read', 'content.write', 'support.read', 'support.write', 'analytics.read'] },
  { id: '3', name: 'Finance', description: 'Revenue and billing access', is_system: true, permissions: ['billing.read', 'billing.write', 'analytics.read'] },
  { id: '4', name: 'Support', description: 'Support tickets and user viewing', is_system: true, permissions: ['support.read', 'support.write', 'users.read'] },
  { id: '5', name: 'Analyst', description: 'Analytics and reporting access', is_system: true, permissions: ['analytics.read'] },
];

export default function AdminPermissions() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      // Try to fetch roles with their permissions
      const { data: rolesData, error: rolesError } = await supabase
        .from('viralize_roles')
        .select('id, name, description, is_system');

      if (rolesError) {
        // Table might not exist yet — use fallback
        if (import.meta.env.DEV) console.warn('Roles fetch error:', rolesError.message);
        setRoles(FALLBACK_ROLES);
        setUsingFallback(true);
        setLoading(false);
        return;
      }

      if (!rolesData || rolesData.length === 0) {
        setRoles(FALLBACK_ROLES);
        setUsingFallback(true);
        setLoading(false);
        return;
      }

      // Fetch permissions for each role
      const { data: rolePerms } = await supabase
        .from('viralize_role_permissions')
        .select('role_id, permission_id');

      const { data: allPerms } = await supabase
        .from('viralize_permissions')
        .select('id, name');

      const permNameById: Record<string, string> = {};
      (allPerms || []).forEach(p => { permNameById[p.id] = p.name; });

      const rolePermMap: Record<string, string[]> = {};
      (rolePerms || []).forEach(rp => {
        if (!rolePermMap[rp.role_id]) rolePermMap[rp.role_id] = [];
        const name = permNameById[rp.permission_id];
        if (name) rolePermMap[rp.role_id].push(name);
      });

      const enrichedRoles: Role[] = rolesData.map(r => ({
        ...r,
        permissions: rolePermMap[r.id] || [],
      }));

      setRoles(enrichedRoles);
      setUsingFallback(false);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Roles exception:', err);
      setRoles(FALLBACK_ROLES);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminNav mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 ml-0 md:ml-56">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileNavOpen(true)} className="md:hidden p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-muted/50 border border-border">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold">Permissions & Roles</h1>
                <p className="text-xs text-muted-foreground">
                  {usingFallback
                    ? 'Showing default roles — apply migrations to manage from database'
                    : `${roles.length} roles configured`}
                </p>
              </div>
            </div>
            <button onClick={fetchRoles} disabled={loading} className="p-1.5 text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted/30 transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>

          {usingFallback && (
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-accent font-medium">Roles are showing defaults</p>
              <p className="text-xs text-muted-foreground mt-1">
                Run database migration 004 to enable managing roles from the database.
              </p>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {loading ? (
              <div className="px-4 py-12 text-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading roles...</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {roles.map(r => (
                  <div key={r.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.description}</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        {r.is_system && (
                          <Badge className="bg-muted text-muted-foreground border-0 text-[9px]">System</Badge>
                        )}
                        <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                          {r.permissions.length} permission{r.permissions.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {r.permissions.map(p => {
                        const pm = PERMISSION_MAP[p];
                        return (
                          <Badge key={p} className="bg-muted text-muted-foreground border-0 text-[10px] gap-1">
                            {pm?.icon} {pm?.label || p}
                          </Badge>
                        );
                      })}
                    </div>
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
