import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardTopbar } from './DashboardTopbar';
import { cn } from '@/lib/utils';
import { Home, Rocket, Library, CreditCard, Bell } from 'lucide-react';

const MOBILE_NAV = [
  { href: '/dashboard', label: 'Home', icon: Home, exact: true },
  { href: '/dashboard', label: 'Create', icon: Rocket },
  { href: '/dashboard/tracks', label: 'Library', icon: Library },
  { href: '/dashboard/notifications', label: 'Alerts', icon: Bell },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  noPlayerPadding?: boolean; // workspace uses own full-height layout
}

export const DashboardLayout = ({ children, noPlayerPadding = false }: DashboardLayoutProps) => {
  const { user, loading } = useAuth();
  const { currentTrack } = useAudioPlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasPlayer = true; // player bar always visible in dashboard

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
        'ml-0 md:ml-56',
        collapsed && 'md:ml-16'
      )}>
        <DashboardTopbar
          sidebarCollapsed={collapsed}
          onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
        />
        <main className={cn(
          "flex-1 min-h-0",
          !noPlayerPadding && "p-4 lg:p-6 md:pb-6",
          !noPlayerPadding && (hasPlayer ? "pb-36" : "pb-24"),
          noPlayerPadding && "overflow-hidden flex flex-col"
        )}>
          {children}
        </main>
      </div>

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className={cn(
        "fixed left-0 right-0 z-50 md:hidden bg-[hsl(var(--background))] border-t border-border/30 safe-area-pb transition-all",
        hasPlayer ? "bottom-[64px]" : "bottom-0"
      )}>
        <div className="flex items-center justify-around h-14">
          {MOBILE_NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                to={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className={cn(
                  'relative flex items-center justify-center w-9 h-9 rounded-xl transition-all',
                  active && 'bg-primary/15'
                )}>
                  <Icon className={cn("w-4.5 h-4.5", active && "text-primary")} />
                  {active && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-primary" />
                  )}
                </div>
                <span className={cn(
                  "text-[9px] font-semibold",
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
