import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Sun, Moon, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { useState } from "react";
import { LogoIcon } from "@/components/ViralizeLogo";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const navLinks = [
    { to: "/analyze", label: "Analyze" },
    { to: "/pricing", label: "Pricing" },
  ];

  const userInitials = (profile?.display_name || user?.email || 'U').slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

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

          {/* Right — Auth + theme toggle (desktop) */}
          <div className="hidden md:flex items-center justify-end gap-3 flex-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#F59E0B] flex items-center justify-center text-sm font-bold text-white hover:opacity-90 transition-opacity focus:outline-none">
                    {userInitials}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-[#111] border border-white/10 text-white rounded-xl p-1"
                >
                  <div className="px-3 py-2 mb-1">
                    <p className="text-xs font-medium truncate">{user.email}</p>
                    <p className="text-[11px] text-white/40 capitalize">{profile?.plan || 'free'} plan</p>
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-sm rounded-lg cursor-pointer hover:bg-white/10 focus:bg-white/10 text-white"
                  >
                    <LayoutDashboard className="h-4 w-4 text-[#8B5CF6]" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate('/settings')}
                    className="flex items-center gap-2 text-sm rounded-lg cursor-pointer hover:bg-white/10 focus:bg-white/10 text-white"
                  >
                    <Settings className="h-4 w-4 text-white/40" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-sm rounded-lg cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 text-red-400"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  onClick={() => setAuthOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-4 text-xs font-semibold tracking-wide uppercase text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="h-8 px-5 text-xs font-semibold tracking-wide uppercase rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-200"
                >
                  <Link to="/analyze">Get Started</Link>
                </Button>
              </>
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
          <div className="md:hidden border-t border-white/[0.06] bg-background/95 backdrop-blur-2xl px-6 py-5 space-y-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block text-sm font-medium tracking-wide uppercase py-3 transition-colors border-b border-white/[0.04]",
                  pathname === l.to ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <div className="pt-3 space-y-2">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm text-white/70 py-2"
                >
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm text-white/70 py-2"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                <button
                  onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  className="flex items-center gap-2 text-sm text-red-400 py-2 w-full"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-3 space-y-2">
                <Button
                  onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                  variant="outline"
                  size="sm"
                  className="w-full h-10 text-xs font-semibold tracking-wide uppercase rounded-full border-white/20 text-white"
                >
                  Sign In
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="w-full h-10 text-xs font-semibold tracking-wide uppercase rounded-full bg-foreground text-background"
                >
                  <Link to="/analyze" onClick={() => setMobileOpen(false)}>Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </nav>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default Navbar;
