import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_LIMITS, Plan } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Music2, CreditCard, Zap, ArrowRight, X, Rocket, Search,
} from 'lucide-react';
import { LogoIcon } from '@/components/ViralizeLogo';

const NAV_ITEMS = [
  { href: '/analyze', label: 'Analyze', icon: Search, description: 'Scan a new track' },
  { href: '/dashboard', label: 'My Tracks', icon: Music2, description: 'Your analyzed songs', exact: true },
  { href: '/dashboard/viral', label: 'Make Viral', icon: Rocket, description: 'Generate hit versions' },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard, description: 'Plans & payments' },
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

  const isActive = (href: string, exact?: boolean) =>
    exact ? location.pathname === href : location.pathname.startsWith(href);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-50 flex-col bg-[#0a0a0a] border-r border-border/30 transition-all duration-200',
        // Hidden on mobile (bottom nav used instead), visible on desktop
        'hidden md:flex',
        !collapsed ? 'md:w-60' : 'md:w-16'
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border/20 shrink-0">
        <Link to="/" className="flex items-center gap-2.5 group">
          <LogoIcon size={24} className="transition-transform duration-300 group-hover:scale-110" />
          {!collapsed && (
            <span className="font-bold text-foreground text-sm tracking-wide uppercase">Viralize</span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, description, exact }) => {
            const active = isActive(href, exact);
            const showText = !collapsed;
            return (
              <Link
                key={href}
                to={href}
                title={!showText ? label : undefined}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150',
                  !showText ? 'justify-center px-2 py-3' : 'px-3 py-3',
                  active
                    ? 'bg-primary/15 text-primary shadow-[0_0_20px_-4px] shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary" />
                )}
                <Icon className={cn("w-5 h-5 shrink-0", active && "text-primary")} />
                {showText && (
                  <div className="flex flex-col">
                    <span className={cn(active ? "text-primary font-semibold" : "")}>{label}</span>
                    <span className="text-[10px] text-muted-foreground/60 font-normal">{description}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Plan upgrade CTA */}
      {!collapsed && plan !== 'studio' && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-primary/8 border border-primary/15">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold text-primary uppercase tracking-wide">
              {PLAN_LIMITS[plan].label} Plan
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            Unlock unlimited analyses
          </p>
          <Button asChild size="sm" className="w-full h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg">
            <Link to="/dashboard/billing">
              Upgrade <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="h-12 flex items-center justify-center border-t border-border/20 shrink-0">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        >
          {collapsed ? <ArrowRight className="w-4 h-4" /> : <X className="w-4 h-4 rotate-0" />}
        </button>
      </div>
    </aside>
  );
};
