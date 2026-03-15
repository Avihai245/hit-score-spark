import { cn } from "@/lib/utils";

/**
 * Viralize Logo — Premium tier, Spotify-grade clarity
 * A single bold "V" made of sound wave bars with gradient
 */
const LogoIcon = ({ size = 32, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="vir-main" x1="0" y1="40" x2="40" y2="0">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    {/* Rounded square — like Apple Music / Spotify icon */}
    <rect width="40" height="40" rx="10" fill="url(#vir-main)" />
    {/* "V" shape made of 3 bold bars — unmistakable at any size */}
    <rect x="10" y="10" width="4.5" rx="2.25" height="12" fill="white" />
    <rect x="17.75" y="10" width="4.5" rx="2.25" height="20" fill="white" />
    <rect x="25.5" y="10" width="4.5" rx="2.25" height="12" fill="white" />
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
      isStacked ? "flex-col gap-4" : "gap-3",
      className
    )}>
      {/* Icon */}
      <div className="relative group/logo flex-shrink-0">
        <div className="absolute -inset-2 rounded-2xl opacity-0 group-hover/logo:opacity-60 transition-all duration-500 bg-primary/30 blur-2xl" />
        <LogoIcon
          size={isStacked ? 64 : 36}
          className="relative z-10 transition-transform duration-200 ease-out group-hover/logo:scale-105"
        />
      </div>

      {/* Wordmark */}
      <div className={cn("flex flex-col", isStacked ? "items-center gap-1.5" : "gap-0")}>
        <span className={cn(
          "font-heading font-black tracking-[-0.03em] leading-none",
          isStacked ? "text-4xl" : "text-xl",
          "text-foreground"
        )}>
          VIRALIZE
        </span>
        {(showTagline || isStacked) && (
          <span className={cn(
            "text-muted-foreground font-semibold uppercase tracking-[0.2em]",
            isStacked ? "text-xs" : "text-[9px] leading-none"
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
