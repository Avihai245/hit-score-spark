import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { LogoIcon } from "@/components/ViralizeLogo";
import { useTheme } from "@/components/ThemeProvider";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: "/analyze", label: "Analyze" },
    { to: "/pricing", label: "Pricing" },
  ];

  return (
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

        {/* Right — theme toggle + CTA (desktop) */}
        <div className="hidden md:flex items-center justify-end gap-3 flex-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Button
            asChild
            size="sm"
            className="h-8 px-5 text-xs font-semibold tracking-wide uppercase rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-200"
          >
            <Link to="/analyze">Get Started</Link>
          </Button>
        </div>

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
                "block text-sm font-medium tracking-wide uppercase py-3 transition-colors border-b border-white/[0.04]",
                pathname === l.to ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3">
            <Button
              asChild
              size="sm"
              className="w-full h-10 text-xs font-semibold tracking-wide uppercase rounded-full bg-foreground text-background"
            >
              <Link to="/analyze" onClick={() => setMobileOpen(false)}>Get Started</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
