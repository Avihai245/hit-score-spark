import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BarChart3, DollarSign, FileText, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/admin/content', label: 'Content', icon: FileText },
];

export const AdminNav = () => {
  const location = useLocation();

  return (
    <div className="w-60 min-h-screen bg-[#111111] border-r border-white/10 flex flex-col">
      {/* Back link */}
      <div className="p-4 border-b border-white/10">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </Link>
      </div>

      {/* Brand */}
      <div className="px-4 py-5">
        <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Admin Panel</p>
        <p className="text-white font-bold text-lg mt-0.5">Viralize</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 pb-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(href);
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-white/30">Admin access only</p>
      </div>
    </div>
  );
};
