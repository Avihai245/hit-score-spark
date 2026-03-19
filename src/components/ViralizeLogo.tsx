import { cn } from "@/lib/utils";

/**
 * Santo Logo — sleek waveform + bold type
 */
const LogoIcon = ({ size = 28, className }: {size?: number;className?: string;}) => { return null; };











































const LOGO_GRADIENT: React.CSSProperties = {
  background: "linear-gradient(180deg, #e0e0e0 0%, #c4b5fd 18%, #f5f5f5 32%, #a78bfa 50%, #d4d4d4 65%, #c084fc 78%, #9ca3af 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  filter: "drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))"
};

const LOGO_SCAN_STYLE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: "linear-gradient(105deg, transparent 0%, transparent 30%, rgba(255,255,255,0.25) 40%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.25) 60%, transparent 70%, transparent 100%)",
  backgroundSize: "200% 100%",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  animation: "logo-scan 3s ease-in-out infinite"
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
          className="relative z-10 transition-transform duration-300 ease-out group-hover/logo:scale-110" />
        
      </div>
      <div className={cn("flex flex-col", isStacked ? "items-center gap-2" : "gap-0")}>
        <span
          className={cn("font-heading leading-none", isStacked ? "text-5xl" : "text-2xl")}
          style={{
            fontWeight: 900,
            letterSpacing: isStacked ? "0.18em" : "0.12em",
            ...LOGO_GRADIENT
          }}>
          
          SANTO
        </span>
        {(showTagline || isStacked) &&
        <span className={cn(
          "font-heading font-semibold uppercase text-muted-foreground/60",
          isStacked ? "text-xs tracking-[0.3em] mt-1" : "text-[8px] tracking-[0.2em] leading-none"
        )}>
            AI Music Intelligence
          </span>
        }
      </div>
    </div>);

};

export { LogoIcon, ViralizeLogo, LOGO_GRADIENT, LOGO_SCAN_STYLE };
export default ViralizeLogo;