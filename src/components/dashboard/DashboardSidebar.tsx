import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_LIMITS, Plan } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Music2, Upload, BarChart2, Lightbulb, GitCompare,
  TrendingUp, Coins, CreditCard, Bell, HelpCircle, User, Settings,
  ChevronLeft, ChevronRight, Zap, ArrowRight, X,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/tracks', label: 'My Songs', icon: Music2 },
      { href: '/dashboard/uploads', label: 'Uploads', icon: Upload },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { href: '/dashboard/recommendations', label: 'AI Recommendations', icon: Lightbulb },
      { href: '/dashboard/compare', label: 'Compare to Hits', icon: GitCompare },
      { href: '/dashboard/insights', label: 'Growth Insights', icon: TrendingUp },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/dashboard/credits', label: 'Credits & Usage', icon: Coins },
      { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
      { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'Help',
    items: [
      { href: '/dashboard/support', label: 'Support', icon: HelpCircle },
      { href: '/dashboard/profile', label: 'Profile', icon: User },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const DashboardSidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }: DashboardSidebarProps) => {
  const location = useLocation();
  const { profile } = useAuth();
  const plan: Plan = (profile?.plan as Plan) || 'free';

  const isActive = (href: string) =>
    href === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(href);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-sidebar-background border-r border-sidebar-border transition-all duration-200',
        // Mobile: slide in/out
        'w-60 -translate-x-full md:translate-x-0',
        mobileOpen && 'translate-x-0',
        // Desktop: collapse
        !collapsed ? 'md:w-60' : 'md:w-16'
      )}
    >
      {/* Logo + mobile close */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          {(!collapsed || mobileOpen) && (
            <span className="font-bold text-sidebar-foreground text-sm">Viralize</span>
          )}
        </Link>
        <button
          onClick={onMobileClose}
          className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {(!collapsed || mobileOpen) && (
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-1.5">
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
                      'flex items-center gap-3 rounded-lg text-[13px] font-medium transition-colors',
                      !showText ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {showText && <span>{label}</span>}
                    {showText && label === 'Notifications' && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                        3
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Plan upgrade CTA */}
      {(!collapsed || mobileOpen) && plan !== 'studio' && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/20 text-primary border-0 text-[10px] uppercase tracking-wider font-bold">
              {PLAN_LIMITS[plan].label}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            Unlock unlimited analyses & AI remixes
          </p>
          <Button asChild size="sm" className="w-full h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg">
            <Link to="/dashboard/billing" onClick={onMobileClose}>
              Upgrade <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      {/* Collapse toggle (desktop only) */}
      <div className="h-12 hidden md:flex items-center justify-center border-t border-sidebar-border shrink-0">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
