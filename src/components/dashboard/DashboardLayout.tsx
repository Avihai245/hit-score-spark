import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardTopbar } from './DashboardTopbar';
import { cn } from '@/lib/utils';
import { Search, Music2, Rocket, CreditCard } from 'lucide-react';

const MOBILE_NAV = [
  { href: '/analyze', label: 'Analyze', icon: Search },
  { href: '/dashboard', label: 'Tracks', icon: Music2, exact: true },
  { href: '/dashboard/viral', label: 'Viral', icon: Rocket },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  const isActive = (href: string, exact?: boolean) =>
    exact ? location.pathname === href : location.pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className={cn(
        'flex flex-col min-h-screen transition-all duration-200',
        'ml-0 md:ml-60',
        collapsed && 'md:ml-16'
      )}>
        <DashboardTopbar
          sidebarCollapsed={collapsed}
          onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
        />
        {/* Main content — add bottom padding on mobile for bottom nav */}
        <main className="flex-1 p-4 lg:p-6 pb-24 md:pb-6">{children}</main>
      </div>

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a0a0a] border-t border-border/30 safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {MOBILE_NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                to={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className={cn(
                  'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all',
                  active && 'bg-primary/15'
                )}>
                  <Icon className={cn("w-5 h-5", active && "text-primary")} />
                  {active && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-primary" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-semibold",
                  active ? "text-primary" : "text-muted-foreground/70"
                )}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
