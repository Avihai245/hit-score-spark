import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_LIMITS, Plan } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown, LogOut, Settings, User, Shield,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardTopbarProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle: () => void;
}

export const DashboardTopbar = ({ sidebarCollapsed, onMobileMenuToggle }: DashboardTopbarProps) => {
  const { user, profile, signOut } = useAuth();
  const plan: Plan = (profile?.plan as Plan) || 'free';
  const initials = (profile?.display_name || user?.email || 'U').slice(0, 2).toUpperCase();

  const PLAN_BADGE: Record<Plan, string> = {
    free: 'bg-muted text-muted-foreground',
    payg: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    pro: 'bg-primary/15 text-primary border-primary/20',
    studio: 'bg-accent/15 text-accent border-accent/20',
  };

  return (
    <header className="h-14 border-b border-border/30 bg-[#0a0a0a] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left — page context */}
      <div className="flex items-center gap-3 flex-1">
        <span className="text-sm font-semibold text-foreground">Dashboard</span>
      </div>

      {/* Right — profile */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[11px] font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-xs font-medium text-foreground max-w-[100px] truncate">
                {profile?.display_name || user?.email?.split('@')[0]}
              </span>
              <Badge className={`${PLAN_BADGE[plan]} border text-[9px] px-1.5 py-0`}>
                {PLAN_LIMITS[plan].label}
              </Badge>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings" className="flex items-center gap-2 text-sm">
                <Settings className="w-3.5 h-3.5" /> Settings
              </Link>
            </DropdownMenuItem>
            {profile?.is_admin && (
              <DropdownMenuItem asChild>
                <Link to="/admin" className="flex items-center gap-2 text-sm">
                  <Shield className="w-3.5 h-3.5" /> Admin Panel
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 text-sm text-destructive">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
