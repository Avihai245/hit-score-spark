import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, BarChart3, DollarSign, FileText, ArrowLeft,
  Music2, Activity, MessageSquare, Megaphone, Shield, ScrollText, Settings,
  ChevronLeft, ChevronRight, Zap, Tag, Heart,
} from 'lucide-react';
import { useState } from 'react';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/tracks', label: 'Tracks', icon: Music2 },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/admin/monitoring', label: 'AI Monitoring', icon: Activity },
    ],
  },
  {
    label: 'Revenue',
    items: [
      { href: '/admin/revenue', label: 'Revenue', icon: DollarSign },
      { href: '/admin/coupons', label: 'Coupons', icon: Tag },
      { href: '/admin/lifecycle', label: 'CRM / Lifecycle', icon: Heart },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/content', label: 'Content', icon: FileText },
      { href: '/admin/support', label: 'Support', icon: MessageSquare },
      { href: '/admin/notifications', label: 'Messaging', icon: Megaphone },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/permissions', label: 'Permissions', icon: Shield },
      { href: '/admin/audit', label: 'Audit Logs', icon: ScrollText },
      { href: '/admin/system', label: 'System Config', icon: Settings },
    ],
  },
];

export const AdminNav = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    href === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(href);

  return (
    <div className={cn(
      'min-h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col transition-all duration-200',
      collapsed ? 'w-16' : 'w-56'
    )}>
      {/* Back + Brand */}
      <div className="p-3 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          {!collapsed && 'Back to App'}
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-[10px] font-semibold text-primary uppercase tracking-widest">Admin</p>
              <p className="text-sm font-bold text-foreground">Viralize</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    to={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg text-[12px] font-medium transition-colors',
                      collapsed ? 'justify-center px-2 py-2' : 'px-2.5 py-1.5',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {!collapsed && label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse */}
      <div className="p-2 border-t border-sidebar-border">
        <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
