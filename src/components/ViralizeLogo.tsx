import { cn } from "@/lib/utils";

/**
 * Santo Logo — stylized "S" waveform mark
 * A bold, modern audio-wave "S" shape with purple-to-gold gradient.
 */
const LogoIcon = ({ size = 28, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="santo-g" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="hsl(258, 90%, 66%)" />
        <stop offset="60%" stopColor="hsl(280, 80%, 60%)" />
        <stop offset="100%" stopColor="hsl(38, 92%, 55%)" />
      </linearGradient>
      <filter id="santo-glow">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Background circle */}
    <circle cx="18" cy="18" r="17" fill="url(#santo-g)" opacity="0.12" />

    {/* Equalizer bars forming an abstract "S" flow */}
    <rect x="6" y="18" width="3.2" rx="1.6" height="10" fill="url(#santo-g)" opacity="0.7" />
    <rect x="11" y="14" width="3.2" rx="1.6" height="14" fill="url(#santo-g)" opacity="0.85" />
    <rect x="16.4" y="8" width="3.2" rx="1.6" height="20" fill="url(#santo-g)" />
    <rect x="21.8" y="14" width="3.2" rx="1.6" height="14" fill="url(#santo-g)" opacity="0.85" />
    <rect x="27" y="8" width="3.2" rx="1.6" height="10" fill="url(#santo-g)" opacity="0.7" />

    {/* Accent arc — subtle "S" curve connecting the bars */}
    <path
      d="M7.5 23 C12 20, 14 14, 18 15 C22 16, 24 12, 28.5 13"
      stroke="url(#santo-g)"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.5"
      filter="url(#santo-glow)"
    />
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
      isStacked ? "flex-col gap-3" : "gap-2.5",
      className
    )}>
      <div className="relative group/logo flex-shrink-0">
        {/* Glow effect on hover */}
        <div className="absolute -inset-3 rounded-full opacity-0 group-hover/logo:opacity-60 transition-opacity duration-500 bg-primary/25 blur-2xl" />
        <LogoIcon
          size={isStacked ? 52 : 30}
          className="relative z-10 transition-transform duration-300 ease-out group-hover/logo:scale-110"
        />
      </div>
      <div className={cn("flex flex-col", isStacked ? "items-center gap-1" : "gap-0")}>
        <span className={cn(
          "font-heading font-bold tracking-[0.14em] uppercase leading-none",
          isStacked ? "text-3xl tracking-[0.2em]" : "text-base",
          "brand-gradient-text"
        )}>
          SANTO
        </span>
        {(showTagline || isStacked) && (
          <span className={cn(
            "text-muted-foreground font-medium uppercase tracking-[0.25em]",
            isStacked ? "text-[10px]" : "text-[7.5px] leading-none"
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
