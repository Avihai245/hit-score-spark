import { Link, useLocation } from "react-router-dom";
import { Music } from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const { pathname } = useLocation();

  const links = [
    { to: "/analyze", label: "Analyze" },
    { to: "/pricing", label: "Pricing" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold">
          <Music className="h-5 w-5 text-primary" />
          <span>HitCheck</span>
        </Link>
        <div className="flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === l.to ? "text-primary" : "text-muted-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
