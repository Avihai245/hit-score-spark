import { cn } from "@/lib/utils";

/**
 * Santo Logo — sleek waveform + bold type
 */
const LogoIcon = ({ size = 28, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 44 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="santo-wave" x1="0" y1="16" x2="44" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="hsl(258, 90%, 66%)" />
        <stop offset="100%" stopColor="hsl(38, 92%, 55%)" />
      </linearGradient>
      <filter id="wglow">
        <feGaussianBlur stdDeviation="1.8" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    {/* Waveform — smooth organic sound wave */}
    <path
      d="M2 16 Q6 16, 8 12 Q10 8, 12 12 Q14 16, 16 10 Q18 4, 20 10 Q22 16, 24 6 Q26 -2, 28 6 Q30 16, 32 10 Q34 4, 36 12 Q38 18, 40 14 Q42 12, 44 16"
      stroke="url(#santo-wave)"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      filter="url(#wglow)"
    />

    {/* Mirror wave below — creates depth */}
    <path
      d="M2 16 Q6 16, 8 20 Q10 24, 12 20 Q14 16, 16 22 Q18 28, 20 22 Q22 16, 24 26 Q26 34, 28 26 Q30 16, 32 22 Q34 28, 36 20 Q38 14, 40 18 Q42 20, 44 16"
      stroke="url(#santo-wave)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity="0.3"
    />
  </svg>
);

const LOGO_GRADIENT: React.CSSProperties = {
  background: "linear-gradient(180deg, #e0e0e0 0%, #c4b5fd 18%, #f5f5f5 32%, #a78bfa 50%, #d4d4d4 65%, #c084fc 78%, #9ca3af 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  filter: "drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))",
};

const LOGO_SCAN_STYLE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: "linear-gradient(105deg, transparent 0%, transparent 35%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.15) 55%, transparent 65%, transparent 100%)",
  backgroundSize: "200% 100%",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  animation: "logo-scan 4s ease-in-out infinite",
};

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
      <div className="relative group/logo flex-shrink-0">
        <div className="absolute -inset-4 rounded-full opacity-0 group-hover/logo:opacity-50 transition-opacity duration-700 bg-primary/30 blur-3xl" />
        <LogoIcon
          size={isStacked ? 64 : 36}
          className="relative z-10 transition-transform duration-300 ease-out group-hover/logo:scale-110"
        />
      </div>
      <div className={cn("flex flex-col", isStacked ? "items-center gap-2" : "gap-0")}>
        <span
          className={cn("font-heading leading-none", isStacked ? "text-5xl" : "text-2xl")}
          style={{
            fontWeight: 900,
            letterSpacing: isStacked ? "0.18em" : "0.12em",
            ...LOGO_GRADIENT,
          }}
        >
          SANTO
        </span>
        {(showTagline || isStacked) && (
          <span className={cn(
            "font-heading font-semibold uppercase text-muted-foreground/60",
            isStacked ? "text-xs tracking-[0.3em] mt-1" : "text-[8px] tracking-[0.2em] leading-none"
          )}>
            AI Music Intelligence
          </span>
        )}
      </div>
    </div>
  );
};

export { LogoIcon, ViralizeLogo, LOGO_GRADIENT, LOGO_SCAN_STYLE };
export default ViralizeLogo;
