import { cn } from "@/lib/utils";

const LogoIcon = ({ size = 36, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="vir-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="vir-grad-arrow" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#FBBF24" />
      </linearGradient>
    </defs>
    {/* Waveform bars morphing upward */}
    <rect x="4" y="24" width="3.5" rx="1.75" height="10" fill="url(#vir-grad)" opacity="0.7" />
    <rect x="10" y="18" width="3.5" rx="1.75" height="16" fill="url(#vir-grad)" opacity="0.8" />
    <rect x="16" y="12" width="3.5" rx="1.75" height="22" fill="url(#vir-grad)" opacity="0.9" />
    <rect x="22" y="8" width="3.5" rx="1.75" height="26" fill="url(#vir-grad)" />
    {/* Arrow / viral upward burst */}
    <path
      d="M30 22 L33 6 L36 22"
      stroke="url(#vir-grad-arrow)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M29 12 L33 4 L37 12"
      stroke="url(#vir-grad-arrow)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Spark dots */}
    <circle cx="33" cy="3" r="1.5" fill="#FBBF24" />
    <circle cx="38" cy="8" r="1" fill="#FBBF24" opacity="0.6" />
    <circle cx="28" cy="7" r="1" fill="#8B5CF6" opacity="0.6" />
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
      isStacked ? "flex-col gap-2" : "gap-3",
      className
    )}>
      <div className={cn(
        "relative group/logo",
        isStacked ? "" : ""
      )}>
        {/* Hover glow */}
        <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-0 rounded-full bg-accent/20 blur-lg opacity-0 group-hover/logo:opacity-100 transition-opacity duration-700 delay-100" />
        <LogoIcon size={isStacked ? 56 : 38} className="relative z-10 drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]" />
      </div>
      <div className={cn(
        "flex flex-col",
        isStacked ? "items-center" : ""
      )}>
        <span
          className={cn(
            "font-black font-heading uppercase tracking-wider brand-gradient-text",
            isStacked ? "text-3xl" : "text-xl"
          )}
        >
          VIRALIZE
        </span>
        {(showTagline || isStacked) && (
          <span className={cn(
            "text-muted-foreground font-medium tracking-wide",
            isStacked ? "text-sm mt-0.5" : "text-[10px] leading-tight -mt-0.5"
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
