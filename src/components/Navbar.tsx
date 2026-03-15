import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const WaveformLogo = () => (
  <svg width="36" height="36" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 14C4 14 6 8 8 14C10 20 12 14 12 14" stroke="hsl(258 90% 66%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 14C12 14 14 4 16 14C18 24 20 14 20 14" stroke="hsl(258 90% 66%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 14C20 14 22 10 24 14" stroke="hsl(38 92% 50%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Navbar = () => {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: "/analyze", label: "Analyze" },
    { to: "/pricing", label: "Pricing" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <WaveformLogo />
          </div>
          <span className="text-xl font-black font-heading brand-gradient-text tracking-tight">Viralize</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "text-sm font-semibold transition-colors hover:text-primary px-1",
                pathname === l.to ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
          <Button
            asChild
            size="sm"
            className="bg-accent text-accent-foreground font-bold hover:bg-accent/90 glow-gold ml-2"
          >
            <Link to="/pricing">Get Pro</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl px-4 py-4 space-y-3">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block text-sm font-semibold py-2.5 transition-colors",
                pathname === l.to ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
          <Button
            asChild
            size="sm"
            className="w-full bg-accent text-accent-foreground font-bold hover:bg-accent/90"
          >
            <Link to="/pricing" onClick={() => setMobileOpen(false)}>Get Pro</Link>
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
