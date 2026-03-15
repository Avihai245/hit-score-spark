import { cn } from "@/lib/utils";

/**
 * Viralize Logo — Apple-grade minimalism
 * Monochrome icon, pure white on transparent. Gradient only on hover.
 * The mark: a single continuous waveform "pulse" — like a heartbeat for music.
 */
const LogoIcon = ({ size = 32, className, mono = false }: { size?: number; className?: string; mono?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="vir-pulse" x1="0" y1="16" x2="32" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor={mono ? "white" : "#A78BFA"} />
        <stop offset="50%" stopColor={mono ? "white" : "#8B5CF6"} />
        <stop offset="100%" stopColor={mono ? "white" : "#F59E0B"} />
      </linearGradient>
    </defs>
    {/* Single continuous waveform path — clean, iconic, unmistakable */}
    <path
      d="M2 16 Q5 16 6 13 Q7 10 8 16 Q9 22 10 16 L11 16 Q12 16 13 6 Q14 -2 15 16 Q16 34 17 16 Q18 -2 19 16 L20 16 Q21 16 22 12 Q23 8 24 16 Q25 24 26 16 Q27 8 28 16 L30 16"
      stroke="url(#vir-pulse)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
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
      "flex items-center select-none",
      isStacked ? "flex-col gap-3" : "gap-2.5",
      className
    )}>
      {/* Icon */}
      <div className="relative group/logo flex-shrink-0">
        <div className="absolute -inset-3 rounded-full opacity-0 group-hover/logo:opacity-50 transition-opacity duration-700 bg-primary/20 blur-2xl" />
        <LogoIcon
          size={isStacked ? 48 : 28}
          className="relative z-10 transition-all duration-300 ease-out group-hover/logo:drop-shadow-[0_0_12px_rgba(139,92,246,0.4)]"
        />
      </div>

      {/* Wordmark — SF Pro inspired: light weight, wide tracking */}
      <div className={cn("flex flex-col", isStacked ? "items-center gap-1" : "gap-0")}>
        <span className={cn(
          "font-heading leading-none",
          isStacked
            ? "text-[2.5rem] font-semibold tracking-[0.08em]"
            : "text-lg font-semibold tracking-[0.06em]",
          "text-foreground"
        )}>
          VIRALIZE
        </span>
        {(showTagline || isStacked) && (
          <span className={cn(
            "text-muted-foreground font-normal tracking-[0.25em] uppercase",
            isStacked ? "text-[11px] mt-1" : "text-[7.5px] leading-none"
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
