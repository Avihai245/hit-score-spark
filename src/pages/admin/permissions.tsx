import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Shield, Users, Eye, Settings, DollarSign, MessageSquare, BarChart3, ScrollText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ROLES = [
  { role: 'Super Admin', desc: 'Full platform access', permissions: ['all'] },
  { role: 'Admin', desc: 'Manage users, content, support', permissions: ['users', 'content', 'support', 'analytics'] },
  { role: 'Finance', desc: 'Revenue and billing access', permissions: ['revenue', 'billing'] },
  { role: 'Support', desc: 'Support tickets and user viewing', permissions: ['support', 'users_read'] },
  { role: 'Analyst', desc: 'Analytics and reporting access', permissions: ['analytics'] },
];

const PERMISSION_MAP: Record<string, { icon: React.ReactNode; label: string }> = {
  all: { icon: <Shield className="w-3.5 h-3.5" />, label: 'Full Access' },
  users: { icon: <Users className="w-3.5 h-3.5" />, label: 'Users' },
  users_read: { icon: <Eye className="w-3.5 h-3.5" />, label: 'Users (Read)' },
  content: { icon: <Settings className="w-3.5 h-3.5" />, label: 'Content' },
  support: { icon: <MessageSquare className="w-3.5 h-3.5" />, label: 'Support' },
  analytics: { icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'Analytics' },
  revenue: { icon: <DollarSign className="w-3.5 h-3.5" />, label: 'Revenue' },
  billing: { icon: <DollarSign className="w-3.5 h-3.5" />, label: 'Billing' },
  audit: { icon: <ScrollText className="w-3.5 h-3.5" />, label: 'Audit' },
};

export default function AdminPermissions() {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminNav />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Permissions & Roles</h1>
            <p className="text-xs text-muted-foreground">Define admin access levels</p>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {ROLES.map((r, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.role}</p>
                      <p className="text-xs text-muted-foreground">{r.desc}</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-0 text-[10px]">{r.permissions.length} permissions</Badge>
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
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
