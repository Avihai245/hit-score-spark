import { cn } from "@/lib/utils";

/**
 * Viralize Logo — Spotify/Apple Music grade
 * Clean rounded-square icon with perfectly balanced sound bars
 */
const LogoIcon = ({ size = 32, className }: { size?: number; className?: string }) => {
  const s = size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="vir-bg" x1="0" y1="48" x2="48" y2="0">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      {/* Smooth superellipse-style rounded rect */}
      <rect width="48" height="48" rx="12" fill="url(#vir-bg)" />
      {/* 5 sound bars — symmetrical, Apple-clean, white */}
      <rect x="9"  y="20" width="4" height="8"  rx="2" fill="white" fillOpacity="0.95" />
      <rect x="16" y="14" width="4" height="20" rx="2" fill="white" fillOpacity="0.95" />
      <rect x="23" y="8"  width="4" height="32" rx="2" fill="white" />
      <rect x="30" y="14" width="4" height="20" rx="2" fill="white" fillOpacity="0.95" />
      <rect x="37" y="18" width="4" height="12" rx="2" fill="white" fillOpacity="0.95" />
    </svg>
  );
};

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
      {/* Icon with hover glow */}
      <div className="relative group/logo flex-shrink-0">
        <div className="absolute -inset-3 rounded-2xl opacity-0 group-hover/logo:opacity-100 transition-all duration-700 bg-[radial-gradient(circle,_hsl(258_90%_66%_/_0.35),_transparent_70%)] blur-xl" />
        <LogoIcon
          size={isStacked ? 56 : 34}
          className="relative z-10 transition-transform duration-300 ease-out group-hover/logo:scale-[1.06]"
        />
      </div>

      {/* Text */}
      <div className={cn("flex flex-col", isStacked ? "items-center gap-1" : "gap-0")}>
        <span className={cn(
          "font-heading font-extrabold tracking-[-0.02em] text-foreground leading-none",
          isStacked ? "text-[2rem]" : "text-[1.15rem]"
        )}>
          Viralize
        </span>
        {(showTagline || isStacked) && (
          <span className={cn(
            "text-muted-foreground font-medium uppercase tracking-[0.15em]",
            isStacked ? "text-[11px]" : "text-[8px] leading-none"
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
