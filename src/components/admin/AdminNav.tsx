import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, BarChart3, DollarSign, FileText, ArrowLeft,
  Music2, Activity, MessageSquare, Megaphone, Shield, ScrollText, Settings,
  ChevronLeft, ChevronRight, Tag, Heart, X,
} from 'lucide-react';
import { useState } from 'react';
import { LOGO_GRADIENT, LOGO_SCAN_STYLE } from '@/components/ViralizeLogo';

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

interface AdminNavProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const AdminNav = ({ mobileOpen = false, onMobileClose }: AdminNavProps) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    href === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(href);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onMobileClose} />
      )}

      <div className={cn(
        'fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-sidebar-background border-r border-sidebar-border transition-all duration-200',
        // Mobile: slide in/out
        'w-56 -translate-x-full md:translate-x-0',
        mobileOpen && 'translate-x-0',
        // Desktop: collapse
        collapsed ? 'md:w-16' : 'md:w-56'
      )}>
        {/* Back + Brand */}
        <div className="p-3 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              {(!collapsed || mobileOpen) && 'Back to App'}
            </Link>
            {mobileOpen && (
              <button onClick={onMobileClose} className="md:hidden p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {(!collapsed || mobileOpen) ? (
              <span className="relative inline-block">
                <span
                  className="font-heading leading-none text-2xl"
                  style={{ fontWeight: 900, letterSpacing: "0.14em", ...LOGO_GRADIENT }}>
                  SANTO
                </span>
                <span
                  className="absolute inset-0 font-heading leading-none text-2xl pointer-events-none"
                  style={{ fontWeight: 900, letterSpacing: "0.14em", ...LOGO_SCAN_STYLE }}
                  aria-hidden="true">
                  SANTO
                </span>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mt-0.5">Admin Panel</p>
              </span>
            ) : (
              <span
                className="font-heading leading-none text-xl"
                style={{ fontWeight: 900, ...LOGO_GRADIENT }}>
                S
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {(!collapsed || mobileOpen) && (
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  const showText = !collapsed || mobileOpen;
                  return (
                    <Link
                      key={href}
                      to={href}
                      onClick={onMobileClose}
                      title={!showText ? label : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg text-[12px] font-medium transition-colors',
                        !showText ? 'justify-center px-2 py-2' : 'px-2.5 py-1.5',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      {showText && label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse (desktop only) */}
        <div className="p-2 border-t border-sidebar-border hidden md:block">
          <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </>
  );
};
