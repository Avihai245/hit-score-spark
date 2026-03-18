import { cn } from "@/lib/utils";

/**
 * Santo Logo — halo + waveform
 * A glowing halo floating above rising sound bars.
 * Sacred × Musical × Premium.
 */
const LogoIcon = ({ size = 28, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="sg" x1="0" y1="0" x2="32" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stopColor="#FBBF24" />
        <stop offset="50%"  stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#A78BFA" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="1.2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    {/* Halo — floating circle at top */}
    <circle
      cx="16" cy="7" r="5.5"
      fill="none"
      stroke="url(#sg)"
      strokeWidth="2.2"
      strokeLinecap="round"
      opacity="0.95"
      filter="url(#glow)"
    />

    {/* Sound bars — graduated heights, centered below halo */}
    <rect x="3"    y="21" width="3.5" rx="1.75" height="14" fill="url(#sg)" opacity="0.7" />
    <rect x="9"    y="17" width="3.5" rx="1.75" height="18" fill="url(#sg)" opacity="0.85" />
    <rect x="15"   y="13" width="3.5" rx="1.75" height="22" fill="url(#sg)" />
    <rect x="21"   y="17" width="3.5" rx="1.75" height="18" fill="url(#sg)" opacity="0.85" />
    <rect x="27"   y="21" width="3.5" rx="1.75" height="14" fill="url(#sg)" opacity="0.7" />
  </svg>
);

interface SantoLogoProps {
  variant?: "navbar" | "stacked";
  className?: string;
  showTagline?: boolean;
}

const ViralizeLogo = ({ variant = "navbar", className, showTagline }: SantoLogoProps) => {
  const isStacked = variant === "stacked";

  return (
    <div className={cn(
      "flex items-center select-none",
      isStacked ? "flex-col gap-4" : "gap-2.5",
      className
    )}>
      <div className="relative group/logo flex-shrink-0">
        <div className="absolute -inset-3 rounded-full opacity-0 group-hover/logo:opacity-50 transition-opacity duration-700 bg-amber-400/20 blur-2xl" />
        <LogoIcon
          size={isStacked ? 48 : 28}
          className="relative z-10 transition-transform duration-300 ease-out group-hover/logo:scale-110"
        />
      </div>
      <div className={cn("flex flex-col", isStacked ? "items-center gap-1.5" : "gap-0")}>
        <span className={cn(
          "font-heading font-semibold tracking-[0.12em] uppercase leading-none text-foreground",
          isStacked ? "text-3xl tracking-[0.18em]" : "text-[15px]"
        )}>
          SANTO
        </span>
        {(showTagline || isStacked) && (
          <span className={cn(
            "text-muted-foreground font-normal uppercase tracking-[0.3em]",
            isStacked ? "text-[10px]" : "text-[7px] leading-none"
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
