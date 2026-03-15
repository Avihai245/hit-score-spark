import { cn } from "@/lib/utils";

const LogoIcon = ({ size = 36, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="vir-g1" x1="0" y1="32" x2="32" y2="0">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="70%" stopColor="#D946EF" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    {/* Clean rounded rectangle background */}
    <rect x="0" y="0" width="32" height="32" rx="7.5" fill="url(#vir-g1)" />
    {/* Minimal waveform bars - white, centered, perfectly balanced */}
    <rect x="5.5" y="13" width="2.8" rx="1.4" height="6" fill="white" />
    <rect x="10" y="9.5" width="2.8" rx="1.4" height="13" fill="white" />
    <rect x="14.5" y="6" width="2.8" rx="1.4" height="20" fill="white" />
    <rect x="19" y="9.5" width="2.8" rx="1.4" height="13" fill="white" />
    {/* Last bar as upward arrow — viral growth */}
    <rect x="23.5" y="11" width="2.8" rx="1.4" height="10" fill="white" />
    <path d="M24.9 11 L22.2 15.5 L27.6 15.5 Z" fill="white" />
  </svg>
);

interface ViralizeLogoProps {
  variant?: "navbar" | "stacked";
  className?: string;
  showTagline?: boolean;
}

const ViralizeLogo = ({ variant = "navbar", className, showTagline }: ViralizeLogoProps) => {
  const isStacked = variant === "stacked";

  return (
    <div className={cn(
      "flex items-center",
      isStacked ? "flex-col gap-3" : "gap-2.5",
      className
    )}>
      <div className="relative group/logo">
        <div className="absolute -inset-2 rounded-2xl bg-primary/20 blur-xl opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500" />
        <LogoIcon
          size={isStacked ? 52 : 32}
          className="relative z-10 transition-transform duration-300 group-hover/logo:scale-105"
        />
      </div>
      <div className={cn("flex flex-col", isStacked ? "items-center" : "")}>
        <span className={cn(
          "font-black font-heading tracking-tight text-foreground",
          isStacked ? "text-3xl" : "text-lg"
        )}>
          Viralize
        </span>
        {(showTagline || isStacked) && (
          <span className={cn(
            "text-muted-foreground font-medium tracking-wide",
            isStacked ? "text-xs mt-0.5" : "text-[9px] leading-none -mt-0.5"
          )}>
            AI Music Intelligence
          </span>
        )}
      </div>
    </div>
  );
};

export { LogoIcon, ViralizeLogo };
export default ViralizeLogo;
