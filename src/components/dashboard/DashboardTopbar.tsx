import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_LIMITS, Plan } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown, LogOut, Settings, Shield, Coins,
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
    pro: 'bg-primary/15 text-primary border-primary/20',
    studio: 'bg-accent/15 text-accent border-accent/20',
  };

  return (
    <header className="h-14 border-b border-border/30 bg-[#0a0a0a] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left — plan info strip */}
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-3">
          <Badge className={`${PLAN_BADGE[plan]} border text-[10px] px-2 py-0.5`}>
            {PLAN_LIMITS[plan].label}
          </Badge>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Coins className="w-3 h-3" />
            <span className="font-medium text-foreground">{profile?.credits ?? 0}</span>
            <span>credits</span>
          </div>
          {profile?.plan_expires_at && (
            <span className="hidden lg:block text-[11px] text-muted-foreground">
              · Renews {new Date(profile.plan_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
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
