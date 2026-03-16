import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Sun, Moon, LogOut, Settings, LayoutDashboard, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { LogoIcon } from "@/components/ViralizeLogo";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";

const PLAN_COLORS: Record<string, string> = {
  free: 'text-gray-400',
  payg: 'text-blue-400',
  pro: 'text-purple-400',
  studio: 'text-yellow-400',
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  payg: 'Pay As You Go',
  pro: 'Pro',
  studio: 'Studio',
};

const getInitials = (name?: string | null, email?: string | null) => {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return 'U';
};

const AVATAR_COLORS = [
  'from-purple-500 to-blue-500',
  'from-pink-500 to-purple-500',
  'from-yellow-400 to-orange-500',
  'from-green-400 to-cyan-500',
  'from-blue-400 to-indigo-500',
];

const getAvatarColor = (userId?: string) => {
  if (!userId) return AVATAR_COLORS[0];
  const idx = userId.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { to: "/analyze", label: "Analyze" },
    { to: "/pricing", label: "Pricing" },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    setMobileOpen(false);
    await signOut();
    navigate('/');
  };

  const plan = profile?.plan || 'free';
  const initials = getInitials(profile?.display_name, user?.email);
  const avatarColor = getAvatarColor(user?.id);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-2xl">
        <div className="container flex h-14 md:h-16 items-center">
          {/* Left — nav links (desktop) */}
          <div className="hidden md:flex items-center gap-8 flex-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "text-[13px] font-medium tracking-wide uppercase transition-colors duration-200 hover:text-foreground",
                  pathname === l.to ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {l.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/dashboard"
                className={cn(
                  "text-[13px] font-medium tracking-wide uppercase transition-colors duration-200 hover:text-foreground",
                  pathname === '/dashboard' ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Center — Logo */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute -inset-3 rounded-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-700 bg-primary/25 blur-2xl" />
              <LogoIcon size={30} className="relative z-10 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <span className="text-xl font-heading font-bold tracking-[0.06em] uppercase brand-gradient-text">
              Viralize
            </span>
          </Link>

          {/* Right — auth area (desktop) */}
          <div className="hidden md:flex items-center justify-end gap-3 flex-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {!loading && !user && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAuthModalOpen(true)}
                  className="h-8 px-4 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="h-8 px-5 text-xs font-semibold tracking-wide uppercase rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-all duration-200 border-0"
                >
                  <Link to="/analyze">Analyze Free</Link>
                </Button>
              </>
            )}

            {!loading && user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-white/5 transition-colors"
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
                    {initials}
                  </div>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", dropdownOpen && "rotate-180")} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#111111] border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-semibold text-white truncate">
                        {profile?.display_name || user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-white/40 truncate mt-0.5">{user.email}</p>
                      <span className={`text-xs font-bold mt-1 inline-block ${PLAN_COLORS[plan]}`}>
                        {PLAN_LABELS[plan]} Plan
                      </span>
                    </div>

                    {/* Menu items */}
                    <div className="p-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-primary" />
                        Dashboard
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        Settings
                      </Link>
                    </div>

                    <div className="border-t border-white/10 p-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile right side */}
          <div className="flex-1 flex justify-end items-center gap-1 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-2xl px-6 py-5 space-y-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block text-sm font-medium tracking-wide uppercase py-3 transition-colors border-b border-border/30",
                  pathname === l.to ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {l.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block text-sm font-medium tracking-wide uppercase py-3 transition-colors border-b border-border/30",
                  pathname === '/dashboard' ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Dashboard
              </Link>
            )}
            {user && (
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block text-sm font-medium tracking-wide uppercase py-3 transition-colors border-b border-border/30",
                  pathname === '/settings' ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Settings
              </Link>
            )}
            <div className="pt-3 flex flex-col gap-2">
              {!user ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => { setMobileOpen(false); setAuthModalOpen(true); }}
                    className="w-full h-10 text-xs font-semibold tracking-wide uppercase rounded-full"
                  >
                    Sign In
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="w-full h-10 text-xs font-semibold tracking-wide uppercase rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground border-0"
                  >
                    <Link to="/analyze" onClick={() => setMobileOpen(false)}>Analyze Free</Link>
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 py-2 px-1">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-sm font-bold`}>
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{profile?.display_name || user.email?.split('@')[0]}</p>
                      <p className={`text-xs ${PLAN_COLORS[plan]} font-semibold`}>{PLAN_LABELS[plan]} Plan</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="w-full h-10 text-xs font-semibold tracking-wide uppercase rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};

export default Navbar;
