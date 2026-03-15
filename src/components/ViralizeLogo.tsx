import { cn } from "@/lib/utils";

/**
 * Viralize Logo — Apple-tier
 * Clean waveform pulse mark with subtle gradient. No box, no background.
 * Works as a standalone icon or paired with wordmark.
 */
const LogoIcon = ({ size = 28, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="vg" x1="0" y1="14" x2="28" y2="14" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="60%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    {/* 5 sound bars — perfectly weighted, Apple-clean */}
    <rect x="2"   y="11" width="3" rx="1.5" height="6"  fill="url(#vg)" />
    <rect x="7.5" y="7"  width="3" rx="1.5" height="14" fill="url(#vg)" />
    <rect x="13"  y="3"  width="3" rx="1.5" height="22" fill="url(#vg)" />
    <rect x="18.5" y="7" width="3" rx="1.5" height="14" fill="url(#vg)" />
    <rect x="24"  y="11" width="3" rx="1.5" height="6"  fill="url(#vg)" />
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
      isStacked ? "flex-col gap-4" : "gap-2.5",
      className
    )}>
      <div className="relative group/logo flex-shrink-0">
        <div className="absolute -inset-3 rounded-full opacity-0 group-hover/logo:opacity-50 transition-opacity duration-700 bg-primary/20 blur-2xl" />
        <LogoIcon
          size={isStacked ? 44 : 28}
          className="relative z-10 transition-transform duration-300 ease-out group-hover/logo:scale-110"
        />
      </div>
      <div className={cn("flex flex-col", isStacked ? "items-center gap-1.5" : "gap-0")}>
        <span className={cn(
          "font-heading font-semibold tracking-[0.08em] uppercase leading-none text-foreground",
          isStacked ? "text-3xl tracking-[0.12em]" : "text-[15px]"
        )}>
          VIRALIZE
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
