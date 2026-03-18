import { cn } from "@/lib/utils";

/**
 * Santo Logo — premium audio intelligence brand mark
 * Bold equalizer icon with luxurious gradient typography.
 */
const LogoIcon = ({ size = 28, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="santo-g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="hsl(258, 90%, 66%)" />
        <stop offset="50%" stopColor="hsl(270, 85%, 62%)" />
        <stop offset="100%" stopColor="hsl(38, 92%, 55%)" />
      </linearGradient>
      <linearGradient id="santo-g2" x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="hsl(258, 90%, 72%)" />
        <stop offset="100%" stopColor="hsl(38, 95%, 60%)" />
      </linearGradient>
      <filter id="santo-glow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Soft radial glow behind */}
    <circle cx="20" cy="20" r="18" fill="url(#santo-g)" opacity="0.08" />

    {/* Five equalizer bars — symmetric, graduated */}
    <rect x="5"  y="20" width="4" rx="2" height="14" fill="url(#santo-g)" opacity="0.65" />
    <rect x="12" y="14" width="4" rx="2" height="20" fill="url(#santo-g)" opacity="0.8" />
    <rect x="19" y="6"  width="4" rx="2" height="28" fill="url(#santo-g)" filter="url(#santo-glow)" />
    <rect x="26" y="14" width="4" rx="2" height="20" fill="url(#santo-g)" opacity="0.8" />
    <rect x="33" y="20" width="4" rx="2" height="14" fill="url(#santo-g)" opacity="0.65" />

    {/* Connecting wave accent */}
    <path
      d="M7 27 C13 22, 15 12, 21 13 C27 14, 29 10, 35 14"
      stroke="url(#santo-g2)"
      strokeWidth="1.4"
      strokeLinecap="round"
      fill="none"
      opacity="0.4"
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
      isStacked ? "flex-col gap-4" : "gap-3",
      className
    )}>
      {/* Icon with hover glow */}
      <div className="relative group/logo flex-shrink-0">
        <div className="absolute -inset-4 rounded-full opacity-0 group-hover/logo:opacity-50 transition-opacity duration-700 bg-primary/30 blur-3xl" />
        <LogoIcon
          size={isStacked ? 60 : 36}
          className="relative z-10 transition-transform duration-300 ease-out group-hover/logo:scale-110"
        />
      </div>

      {/* Typography */}
      <div className={cn("flex flex-col", isStacked ? "items-center gap-1.5" : "gap-0.5")}>
        <span
          className={cn(
            "font-heading leading-none",
            isStacked ? "text-4xl tracking-[0.22em]" : "text-xl tracking-[0.16em]",
          )}
          style={{
            fontWeight: 800,
            background: "linear-gradient(135deg, hsl(258, 90%, 66%) 0%, hsl(280, 80%, 60%) 40%, hsl(38, 92%, 55%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          SANTO
        </span>
        {(showTagline || isStacked) && (
          <span className={cn(
            "font-heading font-medium uppercase text-muted-foreground/80",
            isStacked ? "text-xs tracking-[0.3em]" : "text-[8px] tracking-[0.22em] leading-none"
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
