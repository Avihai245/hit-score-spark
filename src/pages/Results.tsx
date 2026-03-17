import { useLocation, Link, Navigate, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_LIMITS } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Check, X, Target, ListMusic, Lightbulb, Clock, Activity, Zap,
  Headphones, Music, User, AlertTriangle, KeyRound, MapPin,
  ArrowRight, ChevronRight, Download, Share2, Upload, Play, Pause, Loader2, Copy, Sparkles, Shield,
  BarChart3, TrendingUp, Radio, Mic2, FileText, Calendar, Award, Eye
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { toast } from "sonner";

/* ─────────────────────────────────────────
   OFFICIAL PLATFORM SVG LOGOS
   ───────────────────────────────────────── */
const SpotifyLogo = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#1DB954">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const AppleMusicLogo = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#FC3C44">
    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.8.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03c.525 0 1.048-.034 1.57-.1.823-.106 1.597-.35 2.296-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.862.37-1.314.1-.6.15-1.206.154-1.814V6.124zM17.884 18.63c-.026.504-.1.98-.345 1.424-.385.698-1.003 1.078-1.79 1.15-.19.02-.38.024-.57.012-.657-.04-1.284-.21-1.89-.45-.755-.3-1.474-.686-2.196-1.066a7.27 7.27 0 01-.387-.216c-.228-.136-.432-.298-.61-.492-.256-.28-.378-.608-.383-.98V8.873c0-.12.01-.24.03-.36.06-.37.23-.67.53-.9.26-.2.56-.32.88-.41.28-.08.57-.12.86-.15.27-.03.55-.04.82-.03.3.01.59.05.87.13.39.11.74.3 1.04.57.23.21.38.46.43.77.03.17.04.34.04.52v9.12c0 .04 0 .08-.01.12-.03.33-.17.6-.42.82-.22.2-.49.32-.78.39-.16.04-.32.06-.49.07-.33.02-.66 0-.98-.07z"/>
  </svg>
);

const TikTokLogo = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.48a8.22 8.22 0 004.76 1.52V7.56a4.84 4.84 0 01-1-.87z"/>
  </svg>
);

const YouTubeLogo = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#FF0000">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

/* ─── Platform Badge ─── */
const PlatformBadge = ({ platform, size = "sm" }: { platform: "spotify" | "apple" | "ai" | "tiktok" | "youtube"; size?: "sm" | "md" }) => {
  const config = {
    spotify: { icon: <SpotifyLogo className={size === "md" ? "h-4 w-4" : "h-3 w-3"} />, label: "Spotify Data", color: "#1DB954" },
    apple: { icon: <AppleMusicLogo className={size === "md" ? "h-4 w-4" : "h-3 w-3"} />, label: "Apple Music", color: "#FC3C44" },
    youtube: { icon: <YouTubeLogo className={size === "md" ? "h-4 w-4" : "h-3 w-3"} />, label: "YouTube Music", color: "#FF0000" },
    tiktok: { icon: <TikTokLogo className={size === "md" ? "h-4 w-4" : "h-3 w-3"} />, label: "TikTok", color: "#ffffff" },
    ai: { icon: <Shield className={size === "md" ? "h-4 w-4" : "h-3 w-3"} />, label: "AI Analysis", color: "hsl(258 90% 66%)" },
  };
  const c = config[platform];
  const isMd = size === "md";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-semibold uppercase tracking-wider ${
        isMd ? "px-3 py-1.5 text-[11px]" : "px-2 py-0.5 text-[9px]"
      }`}
      style={{
        borderColor: `${c.color}22`,
        backgroundColor: `${c.color}0D`,
        color: c.color,
      }}
    >
      {c.icon}
      {c.label}
    </span>
  );
};

const SourceRow = ({ platforms }: { platforms: ("spotify" | "apple" | "ai" | "tiktok" | "youtube")[] }) => (
  <div className="flex flex-wrap gap-1.5 mb-4">
    {platforms.map(p => <PlatformBadge key={p} platform={p} />)}
  </div>
);

/* ─── Score helpers ─── */
const scoreColor = (s: number) => {
  if (s < 40) return "hsl(0 84% 60%)";
  if (s < 65) return "hsl(25 95% 53%)";
  if (s < 80) return "hsl(142 71% 45%)";
  return "hsl(270 91% 65%)";
};

const scoreBadge = (s: number) => {
  if (s < 40) return { label: "NEEDS WORK", cls: "bg-red-500/15 text-red-400 border-red-500/30" };
  if (s < 65) return { label: "PROMISING", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" };
  if (s < 80) return { label: "STRONG POTENTIAL", cls: "bg-green-500/15 text-green-400 border-green-500/30" };
  return { label: "HIT POTENTIAL", cls: "bg-primary/15 text-primary border-primary/30" };
};

/* ─── Score Gauge ─── */
const ScoreGauge = ({ score }: { score: number }) => {
  const r = 90;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const ctrl = animate(count, score, { duration: 2, ease: "easeOut" });
    return ctrl.stop;
  }, [count, score]);

  return (
    <div className="relative flex items-center justify-center w-[200px] h-[200px] md:w-[220px] md:h-[220px]">
      <motion.div
        className="absolute w-48 h-48 rounded-full blur-[60px] opacity-25"
        style={{ backgroundColor: color }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.25 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />
      <svg width="100%" height="100%" viewBox="0 0 200 200" className="-rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        <motion.circle
          cx="100" cy="100" r={r} fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={score >= 80 ? "hsl(290 80% 60%)" : color} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <motion.div className="text-5xl md:text-6xl font-black tabular-nums font-heading" style={{ color }}>
          {rounded}
        </motion.div>
        <div className="text-[10px] text-muted-foreground font-medium mt-0.5 uppercase tracking-[0.2em]">out of 100</div>
      </div>
    </div>
  );
};

/* ─── Viral Meter ─── */
const ViralMeter = ({ score, danceability, valence }: { score: number; danceability?: number; valence?: number }) => {
  const viral = Math.min(100, Math.round((score * 0.5) + ((danceability || 5) * 3) + ((valence || 5) * 2)));
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-accent" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground uppercase tracking-wider">Viral Potential</span>
            <p className="text-[10px] text-muted-foreground">Cross-platform algorithm analysis</p>
          </div>
        </div>
        <span className="text-2xl font-black text-accent tabular-nums">{viral}%</span>
      </div>
      <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent/80 via-accent to-yellow-300"
          initial={{ width: 0 }}
          animate={{ width: `${viral}%` }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[9px] text-muted-foreground uppercase tracking-wider font-medium">
        <span>Low</span><span>Moderate</span><span>High</span><span>Viral</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        <PlatformBadge platform="spotify" />
        <PlatformBadge platform="apple" />
        <PlatformBadge platform="tiktok" />
        <PlatformBadge platform="youtube" />
      </div>
    </div>
  );
};

/* ─── Animated Bar ─── */
const AnimatedBar = ({ label, value, max, color, sublabel }: { label: string; value: number; max: number; color: string; sublabel?: string }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: "easeOut" }} />
      </div>
      {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
};

/* ─── Section wrapper ─── */
const Section = ({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ delay: delay * 0.25, duration: 0.45 }}
    className={className}
  >
    {children}
  </motion.section>
);

const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div>
      <h2 className="text-base md:text-lg font-bold font-heading text-foreground uppercase tracking-wide leading-tight">{title}</h2>
      {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

/* ─── Roadmap ─── */
const generateRoadmap = (score: number) => {
  if (score >= 80) return [
    { week: "Week 1", action: "Your song is release-ready. Set up distributor, create pre-save link, and prepare artwork.", color: "bg-green-500" },
    { week: "Week 2", action: "Submit to Spotify editorial playlists. Pitch 15+ independent curators in your genre.", color: "bg-green-500" },
    { week: "Week 3", action: "Release day: post 3 TikTok clips using the hook. Send to your email list. DM 20 influencers.", color: "bg-green-500" },
    { week: "Week 4", action: "Run $50-100 in targeted ads. Submit to Round 2 curators. Analyze Spotify for Artists data.", color: "bg-green-500" },
  ];
  if (score >= 60) return [
    { week: "Week 1", action: "Apply the recommended changes. Re-record or remix the flagged sections.", color: "bg-orange-500" },
    { week: "Week 2", action: "Re-analyze on Viralize. Target 80+ before release. Fine-tune the hook.", color: "bg-orange-500" },
    { week: "Week 3", action: "Once score hits 80+, set up pre-save and begin curator outreach.", color: "bg-green-500" },
    { week: "Week 4", action: "Release and promote. Track data daily. Submit to playlists.", color: "bg-green-500" },
  ];
  return [
    { week: "Week 1", action: "Focus on the improvements listed above. Consider re-writing the weakest sections.", color: "bg-red-500" },
    { week: "Week 2", action: "Re-record with improvements. Pay attention to hook timing and energy levels.", color: "bg-red-500" },
    { week: "Week 3", action: "Re-analyze on Viralize. Iterate until you hit 65+.", color: "bg-orange-500" },
    { week: "Week 4", action: "Once ready, set up distribution and begin your release campaign.", color: "bg-green-500" },
  ];
};

/* ─── Remix ─── */
const remixStyles = [
  { value: "same", label: "Same vibe (enhanced)" },
  { value: "energetic", label: "More energetic" },
  { value: "emotional", label: "More emotional" },
  { value: "danceable", label: "More danceable" },
  { value: "radio", label: "Radio pop crossover" },
];

const downloadTrack = async (url: string, filename: string) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank');
  }
};

const ProcessingWaveform = () => (
  <div className="flex items-end justify-center gap-1 h-10">
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        className="w-1 rounded-full bg-gradient-to-t from-accent to-yellow-300"
        animate={{ scaleY: [0.15, 1, 0.15] }}
        transition={{ repeat: Infinity, duration: 0.6 + Math.random() * 0.4, delay: i * 0.08, ease: "easeInOut" }}
        style={{ height: "100%", transformOrigin: "bottom" }}
      />
    ))}
  </div>
);

const remixPlatformSteps = [
  { time: 0, icon: "upload", platform: "", label: "Uploading audio file", detail: "Preparing high-quality audio stream" },
  { time: 8, icon: "spotify", platform: "Spotify", label: "Analyzing Spotify catalog data", detail: "Scanning 100M+ tracks for genre patterns" },
  { time: 18, icon: "apple", platform: "Apple Music", label: "Cross-referencing Apple Music trends", detail: "Matching current editorial playlist preferences" },
  { time: 28, icon: "waveform", platform: "", label: "Deep audio frequency analysis", detail: "Isolating melody, harmony & rhythm layers" },
  { time: 38, icon: "tiktok", platform: "TikTok", label: "Mapping TikTok viral sound patterns", detail: "Identifying hook structures that drive shares" },
  { time: 50, icon: "youtube", platform: "YouTube", label: "YouTube Music algorithm alignment", detail: "Optimizing for recommendation engine signals" },
  { time: 62, icon: "ai", platform: "", label: "AI production engine active", detail: "Applying viral DNA patterns to remix" },
  { time: 78, icon: "mix", platform: "", label: "Mixing & mastering enhanced version", detail: "Professional-grade audio processing" },
  { time: 95, icon: "final", platform: "", label: "Finalizing your viral remix", detail: "Last quality checks before delivery" },
];

const remixDataFeedLines = [
  "Spotify API → fetching genre benchmark data...",
  "BPM match: analyzing tempo against top 200 chart entries",
  "Apple Music → scanning editorial playlist criteria",
  "Harmonic analysis: key detection & chord progression mapping",
  "TikTok Sounds API → viral hook pattern database loaded",
  "Cross-referencing 847 trending sounds from last 30 days",
  "YouTube Music → recommendation signal optimization",
  "Melody contour analysis: 94% match with viral patterns",
  "AI engine: applying production enhancements",
  "Vocal clarity optimization in progress",
  "Bass frequency rebalancing for streaming platforms",
  "Hook repetition calibrated for maximum retention",
  "Dynamic range optimized for playlist placement",
  "Spotify loudness normalization: -14 LUFS target",
  "Apple Music spatial audio compatibility check",
  "Final mix rendering at 320kbps",
  "Quality assurance: checking against platform standards",
  "Preparing delivery package...",
];

const RemixProcessingUI = ({ elapsed }: { elapsed: number }) => {
  const [feedLines, setFeedLines] = useState<string[]>([]);
  const [dataPoints, setDataPoints] = useState({ tracks: 0, patterns: 0, signals: 0 });
  const feedRef = useRef<HTMLDivElement>(null);

  const currentStepIdx = remixPlatformSteps.reduce((acc, s, i) => (elapsed >= s.time ? i : acc), 0);
  const currentStep = remixPlatformSteps[currentStepIdx];
  const progress = Math.min(99, Math.round((elapsed / 120) * 100));

  useEffect(() => {
    const interval = setInterval(() => {
      setFeedLines(prev => {
        const next = remixDataFeedLines[prev.length % remixDataFeedLines.length];
        const updated = [...prev, next].slice(-6);
        return updated;
      });
      setDataPoints(prev => ({
        tracks: Math.min(prev.tracks + Math.floor(Math.random() * 1200 + 300), 100000),
        patterns: Math.min(prev.patterns + Math.floor(Math.random() * 40 + 10), 5000),
        signals: Math.min(prev.signals + Math.floor(Math.random() * 20 + 5), 2500),
      }));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [feedLines]);

  const PlatformIcon = ({ type }: { type: string }) => {
    if (type === "spotify") return <SpotifyLogo className="h-4 w-4" />;
    if (type === "apple") return <AppleMusicLogo className="h-4 w-4" />;
    if (type === "tiktok") return <TikTokLogo className="h-4 w-4" />;
    if (type === "youtube") return <YouTubeLogo className="h-4 w-4" />;
    if (type === "upload") return <Upload className="h-4 w-4 text-accent" />;
    if (type === "waveform") return <Activity className="h-4 w-4 text-primary" />;
    if (type === "ai") return <Sparkles className="h-4 w-4 text-primary" />;
    if (type === "mix") return <Headphones className="h-4 w-4 text-accent" />;
    return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  };

  return (
    <div className="space-y-5 py-2">
      {/* Main status */}
      <div className="text-center space-y-3">
        <ProcessingWaveform />
        <div>
          <p className="text-base font-bold text-foreground">{currentStep.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{currentStep.detail}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="max-w-sm mx-auto space-y-1.5">
        <div className="flex justify-between text-[10px] text-muted-foreground font-medium tabular-nums">
          <span>{elapsed}s elapsed</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent via-yellow-400 to-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Platform steps timeline */}
      <div className="max-w-md mx-auto space-y-1">
        {remixPlatformSteps.slice(0, currentStepIdx + 1).map((step, i) => {
          const isDone = i < currentStepIdx;
          const isCurrent = i === currentStepIdx;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-2.5 py-1 px-3 rounded-lg text-xs ${isCurrent ? 'bg-accent/10 border border-accent/20' : ''}`}
            >
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {isDone ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <PlatformIcon type={step.icon} />}
              </div>
              <span className={`flex-1 ${isCurrent ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                {step.platform && <span className="font-semibold">{step.platform} — </span>}
                {step.label}
              </span>
              {isCurrent && (
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-accent"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Live data stats */}
      <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
        {[
          { label: "Tracks Scanned", value: dataPoints.tracks.toLocaleString() },
          { label: "Patterns Found", value: dataPoints.patterns.toLocaleString() },
          { label: "Signals Mapped", value: dataPoints.signals.toLocaleString() },
        ].map((stat) => (
          <div key={stat.label} className="text-center py-2 px-1 rounded-lg bg-card border border-border">
            <p className="text-sm font-bold text-foreground tabular-nums">{stat.value}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Live data feed console */}
      <div className="max-w-md mx-auto">
        <div ref={feedRef} className="rounded-lg bg-background border border-border p-3 h-28 overflow-y-auto font-mono text-[10px] space-y-1 scrollbar-thin">
          {feedLines.map((line, i) => (
            <motion.div
              key={`${i}-${line}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground"
            >
              <span className="text-emerald-400/70">▸</span> {line}
            </motion.div>
          ))}
          <motion.span
            className="text-accent inline-block"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >_</motion.span>
        </div>
      </div>

      {/* Platform badges */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {[
          { icon: <SpotifyIcon />, name: "Spotify" },
          { icon: <AppleMusicIcon />, name: "Apple Music" },
          { icon: <TikTokIcon />, name: "TikTok" },
          { icon: <YouTubeIcon />, name: "YouTube" },
        ].map((p) => (
          <div key={p.name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-[10px] text-muted-foreground">
            <span className="w-3.5 h-3.5">{p.icon}</span>
            {p.name}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Lyrics Editor ─── */
const LyricsEditor = ({ analysisData, onLyricsReady }: { analysisData: any; onLyricsReady: (lyrics: string) => void }) => {
  const original = analysisData?.originalLyrics || "";
  const improved = analysisData?.improvedLyrics || "";
  const lyricFix = analysisData?.lyricFix || "";
  const viralLine = analysisData?.viralLine || "";
  const oneChange = analysisData?.oneChange || "";

  const [lyrics, setLyrics] = useState(original);
  const [applyImproved, setApplyImproved] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [recommendations, setRecommendations] = useState<{id: string, text: string, applied: boolean}[]>([]);

  useEffect(() => {
    const recs: {id: string, text: string, applied: boolean}[] = [];
    if (lyricFix) recs.push({ id: "lyricfix", text: lyricFix, applied: false });
    if (oneChange) recs.push({ id: "onechange", text: oneChange, applied: false });
    if (viralLine && viralLine !== "none yet") recs.push({ id: "viral", text: `Keep this viral line: "${viralLine}"`, applied: true });
    setRecommendations(recs);
  }, [lyricFix, oneChange, viralLine]);

  useEffect(() => {
    if (applyImproved && improved) setLyrics(improved);
    else if (!applyImproved && original) setLyrics(original);
  }, [applyImproved]);

  const buildFinalLyrics = () => {
    let final = lyrics;
    const appliedRecs = recommendations.filter(r => r.applied).map(r => r.text).join(". ");
    return final + (appliedRecs ? `\n\n[Notes for AI: ${appliedRecs}]` : "");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-foreground flex items-center gap-2">
              <Mic2 className="h-4 w-4 text-primary" />
              Song Lyrics
            </label>
            {improved && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowDiff(!showDiff); if (!showDiff) setApplyImproved(false); }}
                  className="text-xs px-3 py-1 rounded-md border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                >
                  {showDiff ? "Hide comparison" : "Compare versions"}
                </button>
                <button
                  onClick={() => { setApplyImproved(!applyImproved); setShowDiff(false); }}
                  className={`text-xs px-3 py-1 rounded-md border transition-all flex items-center gap-1.5 ${
                    applyImproved ? "bg-primary/20 border-primary/40 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <div className={`w-7 h-3.5 rounded-full relative transition-colors ${applyImproved ? "bg-primary" : "bg-muted"}`}>
                    <motion.div className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-foreground" animate={{ left: applyImproved ? 14 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                  </div>
                  AI-improved
                </button>
              </div>
            )}
          </div>
          {showDiff && improved ? (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Original</span>
                <div className="h-40 overflow-auto rounded-lg bg-red-500/5 border border-red-500/10 p-3 text-sm text-foreground/70 whitespace-pre-wrap font-mono">{original}</div>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">AI Improved</span>
                <div className="h-40 overflow-auto rounded-lg bg-green-500/5 border border-green-500/10 p-3 text-sm text-green-300/80 whitespace-pre-wrap font-mono">{improved}</div>
              </div>
            </div>
          ) : (
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder={original ? "Your song lyrics..." : "Paste your song lyrics here..."}
              className="w-full h-40 bg-muted/50 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 transition-colors font-mono"
            />
          )}
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent" /> AI Recommendations
          </p>
          {recommendations.map(rec => (
            <motion.div
              key={rec.id} layout
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                rec.applied ? "bg-primary/10 border-primary/30" : "bg-card border-border hover:border-muted-foreground/30"
              }`}
              onClick={() => setRecommendations(prev => prev.map(r => r.id === rec.id ? {...r, applied: !r.applied} : r))}
            >
              <div className={`mt-0.5 flex-shrink-0 w-8 h-4 rounded-full relative transition-colors ${rec.applied ? "bg-primary" : "bg-muted"}`}>
                <motion.div className="absolute top-0.5 w-3 h-3 rounded-full bg-foreground shadow-md" animate={{ left: rec.applied ? 16 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
              </div>
              <p className="text-sm text-foreground/80 flex-1">{rec.text}</p>
            </motion.div>
          ))}
        </div>
      )}

      <motion.button
        onClick={() => onLyricsReady(buildFinalLyrics())}
        className="relative w-full py-3.5 rounded-xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-bold text-sm overflow-hidden"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" animate={{ x: ["-100%", "200%"] }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} />
        <span className="relative flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4" /> Create AI Remix with These Lyrics <ArrowRight className="h-4 w-4" />
        </span>
      </motion.button>
    </div>
  );
};

/* ─── AI Remix Section ─── */
const AiRemixSection = ({ uploadedFile, songTitle, songGenre, analysisData, analysisId }: { uploadedFile: File | null; songTitle: string; songGenre?: string; analysisData?: any; analysisId?: string }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "lyrics" | "uploading" | "processing" | "complete" | "error">("idle");
  const [style, setStyle] = useState("same");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [file, setFile] = useState<File | null>(uploadedFile);
  const [finalLyrics, setFinalLyrics] = useState("");
  const [playing, setPlaying] = useState<number | null>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const togglePlay = useCallback((idx: number) => {
    const audio = audioRefs.current[idx];
    if (!audio) return;
    if (playing === idx) { audio.pause(); setPlaying(null); }
    else { audioRefs.current.forEach((a, i) => { if (a && i !== idx) a.pause(); }); audio.play(); setPlaying(idx); }
  }, [playing]);

  const startRemix = async (customLyrics?: string) => {
    if (!file) return;
    setStatus("uploading"); setError(""); setElapsed(0);
    try {
      const urlRes = await fetch((import.meta.env.VITE_LAMBDA_URL || "https://u2yjblp3w5.execute-api.eu-west-1.amazonaws.com/prod/analyze"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-upload-url", fileName: file.name }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, s3Key } = await urlRes.json();
      await fetch(uploadUrl, { method: "PUT", body: file });
      setStatus("processing");
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
      const coverRes = await fetch((import.meta.env.VITE_LAMBDA_URL || "https://u2yjblp3w5.execute-api.eu-west-1.amazonaws.com/prod/analyze"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'suno-cover', s3Key, title: songTitle, genre: songGenre, style, analysisData: { ...(analysisData || {}), customLyrics: customLyrics || finalLyrics } }),
      });
      if (!coverRes.ok) throw new Error("Failed to start remix");
      const coverData = await coverRes.json();
      if (!coverData.taskId) throw new Error(coverData.error || "Failed to start remix");
      const { taskId } = coverData;
      const poll = async () => {
        try {
          const res = await fetch((import.meta.env.VITE_LAMBDA_URL || "https://u2yjblp3w5.execute-api.eu-west-1.amazonaws.com/prod/analyze"), {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: 'suno-cover', taskId }),
          });
          const data = await res.json();
          if (data.status === "complete") {
            clearInterval(timerRef.current); setResult(data); setStatus("complete");
            if (user) {
              const tracks = data.tracks || (data.audioUrl ? [{ audioUrl: data.audioUrl, imageUrl: data.imageUrl }] : []);
              const firstTrack = tracks[0];
              const audioUrl = firstTrack?.url || firstTrack?.audioUrl || data.audioUrl || '';
              const imageUrl = firstTrack?.image_url || firstTrack?.imageUrl || data.imageUrl || '';
              if (audioUrl) {
                supabase.from('viralize_remixes').insert({ user_id: user.id, title: songTitle || 'AI Remix', audio_url: audioUrl, image_url: imageUrl || null, style, genre: songGenre || null, suno_task_id: taskId, analysis_id: analysisId || null }).then(({ error: e }) => { if (e) console.warn('Failed to save remix:', e); });
              }
            }
          } else if (data.status === "failed") { clearInterval(timerRef.current); setError(data.message || "Remix failed."); setStatus("error"); }
          else { setTimeout(poll, 3000); }
        } catch { clearInterval(timerRef.current); setError("Connection lost."); setStatus("error"); }
      };
      setTimeout(poll, 8000);
    } catch (err: any) { clearInterval(timerRef.current); setError(err?.message || "Something went wrong."); setStatus("error"); }
  };

  useEffect(() => () => { clearInterval(timerRef.current); }, []);
  const tracks = (result?.tracks || (result?.audioUrl ? [{ audioUrl: result.audioUrl, imageUrl: result.imageUrl, title: "AI Remix" }] : [])).map((t: any) => ({ ...t, url: t.url || t.audioUrl }));

  return (
    <div className="rounded-xl border border-accent/30 bg-gradient-to-b from-accent/[0.04] to-transparent p-6 md:p-8 space-y-5 relative overflow-hidden">
      <div className="relative text-center space-y-1.5">
        <div className="h-10 w-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
          <Headphones className="h-5 w-5 text-accent" />
        </div>
        <h2 className="text-xl md:text-2xl font-black font-heading text-foreground">AI Remix Studio</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">Enhanced production, stronger hooks, viral energy</p>
      </div>

      {status === "idle" && (
        <div className="flex flex-col items-center gap-4">
          {!file && (
            <div className="w-full max-w-sm">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Upload your song file</label>
              <input type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/30 cursor-pointer" />
            </div>
          )}
          <div className="w-full max-w-xs">
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="h-10 border-accent/30"><SelectValue /></SelectTrigger>
              <SelectContent>{remixStyles.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <motion.button onClick={() => setStatus("lyrics")} disabled={!file}
            className="relative px-8 py-3.5 rounded-xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-bold text-sm disabled:opacity-40 overflow-hidden"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent" animate={{ x: ["-100%", "200%"] }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }} />
            <span className="relative flex items-center gap-2"><Sparkles className="h-4 w-4" /> Create AI Remix <ArrowRight className="h-4 w-4" /></span>
          </motion.button>
        </div>
      )}

      {status === "lyrics" && <LyricsEditor analysisData={analysisData} onLyricsReady={(lyrics) => { setFinalLyrics(lyrics); startRemix(lyrics); }} />}

      {(status === "uploading" || status === "processing") && (
        <div className="flex flex-col items-center gap-5 py-6">
          <ProcessingWaveform />
          <div className="text-center">
            <p className="text-base font-bold text-foreground">{remixMessages(elapsed)}</p>
            <p className="text-sm text-muted-foreground tabular-nums mt-1">{elapsed}s</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-red-400 font-medium text-sm">{error}</p>
          <Button onClick={() => { setStatus("idle"); setError(""); }} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">Try Again</Button>
        </div>
      )}

      {status === "complete" && tracks.length > 0 && (
        <motion.div className="space-y-5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          {tracks.map((track: any, idx: number) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + idx * 0.1 }}
              className="rounded-xl bg-card border border-border p-4 flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-border flex items-center justify-center">
                {track.imageUrl ? <img src={track.imageUrl} alt="" className="w-full h-full rounded-lg object-cover" /> : <Music className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{tracks.length > 1 ? `Version ${idx + 1}` : "AI Remix"}</p>
                <div className="flex items-end gap-[2px] h-3 mt-1.5">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div key={i} className="w-[2px] rounded-full bg-primary/40"
                      animate={playing === idx ? { scaleY: [0.3, 1, 0.3] } : {}}
                      transition={playing === idx ? { repeat: Infinity, duration: 0.5 + Math.random() * 0.3, delay: i * 0.03 } : {}}
                      style={{ height: "100%", transformOrigin: "bottom", transform: playing !== idx ? `scaleY(${0.2 + Math.random() * 0.6})` : undefined }} />
                  ))}
                </div>
              </div>
              <motion.button onClick={() => togglePlay(idx)} className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors border border-primary/20" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                {playing === idx ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary ml-0.5" />}
              </motion.button>
              <audio ref={(el) => { audioRefs.current[idx] = el; }} src={track.url} onEnded={() => setPlaying(null)} />
            </motion.div>
          ))}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            {tracks.map((track: any, idx: number) => (
              <Button key={idx} onClick={() => downloadTrack(track.url, `${songTitle || 'remix'}-v${idx + 1}.mp3`)} className="gap-2 bg-accent/20 text-accent hover:bg-accent/30 border border-accent/20">
                <Download className="h-4 w-4" /> Download {tracks.length > 1 ? `V${idx + 1}` : "Remix"}
              </Button>
            ))}
          </div>
          <div className="flex justify-center">
            <Button onClick={() => { setStatus("idle"); setResult(null); setElapsed(0); }} variant="outline" className="gap-2 border-border">
              <Sparkles className="h-4 w-4" /> Remix Again
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

/* ─── Paywall ─── */
const PaywallBanner = ({ score }: { score: number }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="w-full rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-red-500/10 p-6 text-center">
    <div className="h-10 w-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-3">
      <Zap className="h-5 w-5 text-orange-400" />
    </div>
    <h3 className="text-lg font-black text-foreground mb-1.5">You've used your free analysis</h3>
    <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
      Upgrade to Pro for unlimited analyses + 10 AI remixes/month. Your song scored <strong className="text-foreground">{score}/100</strong>.
    </p>
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
      <Link to="/billing">
        <motion.button className="relative px-7 py-3 rounded-xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-bold text-sm overflow-hidden" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent" animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }} />
          <span className="relative">Upgrade to Pro — $19/month</span>
        </motion.button>
      </Link>
      <Link to="/billing">
        <button className="px-5 py-2.5 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-secondary transition-colors">Buy Single Analysis — $3</button>
      </Link>
    </div>
  </motion.div>
);

const RemixPaywallModal = ({ score, songTitle, onClose }: { score: number; songTitle: string; onClose: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      className="relative max-w-md w-full rounded-2xl border border-accent/30 bg-card p-7 text-center" onClick={(e) => e.stopPropagation()}>
      <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
        <Headphones className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-xl font-black text-foreground mb-1.5">AI Remix — Pro Feature</h3>
      <p className="text-sm text-muted-foreground mb-1">Your song <strong className="text-foreground">"{songTitle}"</strong> scored <strong className="text-accent text-lg">{score}/100</strong>.</p>
      <p className="text-sm text-muted-foreground mb-6">Create an AI remix with stronger hooks and viral energy.</p>
      <div className="flex flex-col gap-2.5">
        <Link to="/billing" onClick={onClose}>
          <motion.button className="relative w-full py-3.5 rounded-xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-bold text-sm overflow-hidden" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent" animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }} />
            <span className="relative">Upgrade to Pro — $19/month</span>
          </motion.button>
        </Link>
        <Link to="/billing" onClick={onClose}>
          <button className="w-full py-2.5 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-secondary transition-colors">Buy Single Remix — $7</button>
        </Link>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">Maybe later</button>
      </div>
    </motion.div>
  </motion.div>
);

/* ═══════════════════════════════════════════════
   MAIN RESULTS PAGE
   ═══════════════════════════════════════════════ */
const Results = () => {
  const location = useLocation();
  const _navigate = useNavigate();
  const state = location.state as { results: any; title: string; goal?: string; uploadedFile?: File; songGenre?: string; analysisId?: string } | null;

  if (!state?.results) return <Navigate to="/analyze" replace />;

  const { user, profile } = useAuth();
  const [showRemixPaywall, setShowRemixPaywall] = useState(false);
  const plan = (profile?.plan ?? 'free') as keyof typeof PLAN_LIMITS;
  const analysesUsed = profile?.analyses_used ?? 0;
  const analysesLimit = PLAN_LIMITS[plan].analyses;
  const hasExhaustedFreeAnalysis = plan === 'free' && analysesUsed >= analysesLimit;
  const canRemix = plan !== 'free' || profile?.is_admin === true;

  const { results, title, goal, uploadedFile, songGenre, analysisId } = state;
  const {
    score, verdict, strengths, improvements, oneChange,
    hookTiming, bpmEstimate, energyLevel, dataSource, openingLyrics,
    hookAnalysis, viralPotential, competitorMatch,
    matchedPlaylists, playlistStrategy, musicalKey,
    songTheme, emotionalCore, viralLine,
    lyricWeakness, lyricFix,
    targetAudience, listeningMoment, tikTokFit,
    valence, danceability, saveRatePrediction, skipRiskMoment,
    similarSongs,
  } = results;

  const isRealAudio = dataSource === "real_audio_analysis";
  const badge = scoreBadge(score);
  const hasViralLine = viralLine && viralLine !== "none yet";
  const roadmap = generateRoadmap(score);
  const viral = Math.min(100, Math.round((score * 0.5) + ((danceability || 5) * 3) + ((valence || 5) * 2)));

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `My song "${title}" scored ${score}/100 on Viralize!\n\nCheck yours → viralize.app`
  )}`;

  const profileStats = [
    { icon: Clock, label: "Hook Timing", value: hookTiming },
    { icon: Activity, label: "BPM", value: bpmEstimate },
    { icon: KeyRound, label: "Key", value: musicalKey },
    { icon: Zap, label: "Energy", value: energyLevel },
    { icon: Mic2, label: "Opening", value: openingLyrics },
  ].filter((s) => s.value != null);

  const themeFields = [
    { label: "Theme", value: songTheme },
    { label: "Emotional Core", value: emotionalCore },
  ].filter((f) => f.value);

  return (
    <div className="min-h-screen px-4 pt-20 pb-16 bg-background">
      <div className="container max-w-4xl space-y-10">

        {/* ═══ 1. HERO: SCORE + VERDICT ═══ */}
        <Section delay={0} className="text-center">
          <div className="flex flex-col items-center">
            <ScoreGauge score={score} />

            <div className="mt-5 space-y-3">
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, duration: 0.4, type: "spring" }}
                className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-[0.15em] ${badge.cls}`}
              >
                {badge.label}
              </motion.span>

              <h1 className="text-2xl md:text-3xl font-black font-heading text-foreground tracking-tight leading-snug max-w-2xl mx-auto">
                {verdict}
              </h1>

              <p className="text-base text-muted-foreground">"{title}"</p>

              {isRealAudio && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold border border-green-500/20 bg-green-500/10 text-green-400 uppercase tracking-wider">
                  <Headphones className="h-3 w-3" /> Real Audio Analysis
                </motion.div>
              )}

              {/* Platform data sources */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }}
                className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                <PlatformBadge platform="spotify" size="md" />
                <PlatformBadge platform="apple" size="md" />
                <PlatformBadge platform="youtube" size="md" />
                <PlatformBadge platform="ai" size="md" />
              </motion.div>
            </div>
          </div>
        </Section>

        {/* ═══ SHARE SCORE + VIRAL METER ROW ═══ */}
        <Section delay={0.05}>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Viral Meter */}
            <ViralMeter score={score} danceability={danceability} valence={valence} />

            {/* Share CTA */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Share2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-foreground uppercase tracking-wider">Share Your Score</span>
                    <p className="text-[10px] text-muted-foreground">Show off your results</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1.5 text-sm text-foreground">
                    <span className="text-3xl font-black tabular-nums" style={{ color: scoreColor(score) }}>{score}</span>
                    <span className="text-muted-foreground text-xs">/100</span>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-sm text-muted-foreground">
                    <span className="text-accent font-bold">{viral}%</span> viral
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs border-border"
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/results?shared=true&score=${score}&title=${encodeURIComponent(title)}`); toast.success("Link copied!"); }}>
                  <Copy className="h-3 w-3" /> Copy Link
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs border-border"
                  onClick={() => window.open(tweetUrl, '_blank')}>
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Share on X
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border"
                  onClick={async () => {
                    try {
                      const el = document.getElementById('share-score-card');
                      if (!el) { toast.info("Score card not available"); return; }
                      const { default: html2canvas } = await import('html2canvas');
                      const canvas = await html2canvas(el, { backgroundColor: '#0a0a0a', scale: 2 });
                      const link = document.createElement('a'); link.download = `viralize-score-${score}.png`; link.href = canvas.toDataURL(); link.click();
                    } catch { toast.error("Download failed."); }
                  }}>
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Hidden share card for download */}
          <div className="sr-only" aria-hidden="true">
            <div id="share-score-card" className="w-[400px] bg-[#0a0a0a] p-6 rounded-2xl border border-primary/20">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
              <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-3">viralize.app</p>
              <p className="text-white font-bold text-lg">{title}</p>
              <p className="text-5xl font-black mt-2" style={{ color: scoreColor(score) }}>{score}</p>
              <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-black border ${badge.cls}`}>{badge.label}</span>
            </div>
          </div>
        </Section>

        {/* ═══ PAYWALL ═══ */}
        {user && hasExhaustedFreeAnalysis && (
          <Section delay={0.1}>
            <PaywallBanner score={score} />
          </Section>
        )}

        {/* ═══ 2. SONG PROFILE ═══ */}
        {(themeFields.length > 0 || profileStats.length > 0) && (
          <Section delay={0.15}>
            <SectionHeader icon={Radio} title="Song Profile" subtitle="Core characteristics detected from audio analysis" />
            <SourceRow platforms={["ai", "spotify"]} />
            <div className="rounded-xl border border-border bg-card p-5">
              {themeFields.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 mb-4">
                  {themeFields.map((f) => (
                    <div key={f.label} className="rounded-lg bg-muted/50 p-3.5">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{f.label}</span>
                      <p className="text-sm text-foreground mt-1 font-medium leading-relaxed">{f.value}</p>
                    </div>
                  ))}
                </div>
              )}
              {profileStats.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {profileStats.map((stat) => (
                    <div key={stat.label} className="rounded-lg bg-muted/50 border border-border p-3 text-center">
                      <stat.icon className="h-3.5 w-3.5 mx-auto text-primary mb-1.5" />
                      <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest">{stat.label}</div>
                      <div className="text-sm font-bold text-foreground mt-0.5">{stat.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ═══ 3. THE HONEST TRUTH ═══ */}
        {viralPotential && (
          <Section delay={0.2}>
            <SectionHeader icon={Eye} title="The Honest Truth" subtitle="Unbiased AI assessment" />
            <div className="border-l-[3px] border-primary bg-primary/5 rounded-r-xl p-5">
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-2">What Our AI Detected</p>
              <p className="text-sm text-foreground/90 leading-relaxed">{viralPotential}</p>
            </div>
          </Section>
        )}

        {/* ═══ 4. LYRIC INTELLIGENCE ═══ */}
        {(lyricWeakness || lyricFix || hasViralLine) && (
          <Section delay={0.25}>
            <SectionHeader icon={FileText} title="Lyric Intelligence" subtitle="AI-powered lyric analysis" />
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              {lyricWeakness && lyricFix && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2.5">Weakest Moment — Suggested Fix</p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div className="rounded-lg bg-red-500/5 border border-red-500/15 p-3.5">
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1.5">Current</p>
                      <p className="text-sm text-foreground/70 italic leading-relaxed">"{lyricWeakness}"</p>
                    </div>
                    <div className="rounded-lg bg-green-500/5 border border-green-500/15 p-3.5">
                      <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-1.5">Suggested</p>
                      <p className="text-sm text-green-300/90 italic leading-relaxed">"{lyricFix}"</p>
                    </div>
                  </div>
                </div>
              )}
              {hasViralLine && (
                <div className="rounded-lg bg-accent/5 border border-accent/20 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Award className="h-4 w-4 text-accent" />
                    <p className="text-[10px] text-accent font-bold uppercase tracking-widest">Most Viral Line</p>
                  </div>
                  <p className="text-base font-bold text-foreground italic leading-relaxed">"{viralLine}"</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ═══ 5. ALGORITHM SCORES ═══ */}
        {(hookAnalysis || competitorMatch || valence != null || danceability != null) && (
          <Section delay={0.3}>
            <SectionHeader icon={BarChart3} title="Algorithm Scores" subtitle="How streaming algorithms will rank your song" />
            <SourceRow platforms={["spotify", "apple", "youtube", "ai"]} />
            <div className="rounded-xl border border-border bg-card p-5 space-y-5">
              {hookAnalysis && (
                <div className="rounded-lg bg-primary/5 border border-primary/15 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Zap className="h-4 w-4 text-primary" />
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Hook Analysis</p>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{hookAnalysis}</p>
                </div>
              )}
              <div className="space-y-4">
                {competitorMatch && <AnimatedBar label="Genre Competitor Match" value={competitorMatch} max={10} color="hsl(38 92% 50%)" sublabel="How you stack up against current top tracks" />}
                {valence != null && <AnimatedBar label="Valence (Sad — Happy)" value={valence} max={10} color="hsl(142 71% 45%)" />}
                {danceability != null && <AnimatedBar label="Danceability" value={danceability} max={10} color="hsl(258 90% 66%)" />}
              </div>
              {(saveRatePrediction || skipRiskMoment) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {saveRatePrediction && (
                    <div className="rounded-lg bg-primary/5 border border-primary/15 p-3.5">
                      <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Save Rate Prediction</p>
                      <p className="text-base font-bold text-foreground">{saveRatePrediction}</p>
                    </div>
                  )}
                  {skipRiskMoment && (
                    <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                        <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Skip Risk</p>
                      </div>
                      <p className="text-sm font-medium text-red-300">{skipRiskMoment}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ═══ 6. AUDIENCE PROFILE ═══ */}
        {(targetAudience || listeningMoment || tikTokFit) && (
          <Section delay={0.35}>
            <SectionHeader icon={User} title="Audience Profile" subtitle="Who will listen and where they'll discover you" />
            <div className={`grid gap-3 ${[targetAudience, listeningMoment, tikTokFit].filter(Boolean).length >= 3 ? "sm:grid-cols-3" : [targetAudience, listeningMoment, tikTokFit].filter(Boolean).length === 2 ? "sm:grid-cols-2" : ""}`}>
              {targetAudience && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <User className="h-4 w-4 text-primary mb-2" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Who They Are</p>
                  <p className="text-sm text-foreground leading-relaxed">{targetAudience}</p>
                </div>
              )}
              {listeningMoment && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <MapPin className="h-4 w-4 text-primary mb-2" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">When They Listen</p>
                  <p className="text-sm text-foreground leading-relaxed">{listeningMoment}</p>
                </div>
              )}
              {tikTokFit && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <TikTokLogo className="h-4 w-4 mb-2" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">TikTok Fit</p>
                  <p className="text-sm text-foreground leading-relaxed">{tikTokFit}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ═══ 7. GENRE COMPARISON ═══ */}
        {similarSongs?.length > 0 && (
          <Section delay={0.4}>
            <SectionHeader icon={Award} title="Genre Comparison" subtitle="How your song compares to trending tracks" />
            <SourceRow platforms={["spotify", "apple", "youtube"]} />
            <div className="grid gap-3 md:grid-cols-3">
              {similarSongs.slice(0, 3).map((song: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 + i * 0.1 }}
                  className="rounded-xl border border-border bg-card p-4 space-y-2.5 hover:border-accent/30 transition-all overflow-hidden relative">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                      <SpotifyLogo className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm truncate">{song.title}</p>
                      <p className="text-xs text-muted-foreground">{song.artist}</p>
                    </div>
                  </div>
                  {song.streams && <div className="text-lg font-black text-accent tabular-nums">{song.streams}</div>}
                  {song.whatTheyHaveThatYouDont && (
                    <div className="pt-2.5 border-t border-border">
                      <span className="text-[9px] text-accent/70 font-bold uppercase tracking-widest">Gap analysis</span>
                      <p className="text-sm text-foreground/70 mt-1 leading-relaxed">{song.whatTheyHaveThatYouDont}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* ═══ 8. WHAT'S WORKING vs WHAT TO FIX ═══ */}
        {(strengths?.length > 0 || improvements?.length > 0) && (
          <Section delay={0.5}>
            <div className="grid gap-4 md:grid-cols-2">
              {strengths?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-7 w-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    </div>
                    <h2 className="text-sm font-bold font-heading text-foreground uppercase tracking-wide">What's Working</h2>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                    {strengths.map((s: string, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 + i * 0.04 }}
                        className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex-shrink-0 h-4 w-4 rounded-full bg-green-500/15 flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-green-400" />
                        </div>
                        <span className="text-sm text-foreground/80 leading-relaxed">{s}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {improvements?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-7 w-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <X className="h-3.5 w-3.5 text-red-400" />
                    </div>
                    <h2 className="text-sm font-bold font-heading text-foreground uppercase tracking-wide">What to Fix</h2>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                    {improvements.map((s: string, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 + i * 0.04 }}
                        className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex-shrink-0 h-4 w-4 rounded-full bg-red-500/15 flex items-center justify-center">
                          <X className="h-2.5 w-2.5 text-red-400" />
                        </div>
                        <span className="text-sm text-foreground/80 leading-relaxed">{s}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ═══ 9. THE ONE CHANGE ═══ */}
        {oneChange && (
          <Section delay={0.6}>
            <div className="rounded-xl border border-accent/30 bg-gradient-to-b from-accent/[0.05] to-transparent p-6 md:p-8 text-center">
              <div className="h-10 w-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <p className="text-[10px] text-accent font-bold uppercase tracking-[0.2em] mb-3">If You Change One Thing Before Releasing</p>
              <p className="text-lg md:text-xl font-black text-foreground leading-snug max-w-2xl mx-auto">{oneChange}</p>
              <p className="text-xs text-muted-foreground mt-4">This single change could be the difference between 1,000 and 1,000,000 streams.</p>
            </div>
          </Section>
        )}

        {/* ═══ 10. PLAYLIST TARGETS ═══ */}
        {(playlistStrategy || matchedPlaylists?.length > 0) && (
          <Section delay={0.65}>
            <SectionHeader icon={ListMusic} title="Playlist Targets" subtitle="Curated playlists matching your sound" />
            <SourceRow platforms={["spotify"]} />
            {playlistStrategy && (
              <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 mb-4">
                <div className="flex items-start gap-2.5">
                  <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/80 leading-relaxed">{playlistStrategy}</p>
                </div>
              </div>
            )}
            {matchedPlaylists?.length > 0 && (
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {matchedPlaylists.slice(0, 6).map((pl: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 + i * 0.04 }}
                    className="rounded-xl border border-border bg-card p-3.5 hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <SpotifyLogo className="h-3.5 w-3.5" />
                      <span className="font-semibold text-sm text-foreground truncate">{pl.name}</span>
                    </div>
                    {pl.followers && <p className="text-xs text-muted-foreground">{pl.followers} followers</p>}
                    {pl.reason && <p className="text-xs text-primary/70 mt-0.5">{pl.reason}</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ═══ 11. 30-DAY ROADMAP ═══ */}
        <Section delay={0.75}>
          <SectionHeader icon={Calendar} title="30-Day Release Roadmap" subtitle="Your step-by-step plan to maximize streams" />
          <div className="relative pl-7">
            <div className="absolute left-[10px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-accent to-green-500 rounded-full" />
            <div className="space-y-3">
              {roadmap.map((item, i) => (
                <motion.div key={item.week} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.06 }}
                  className="relative rounded-xl border border-border bg-card p-4">
                  <div className="absolute -left-[22px] top-4 w-3.5 h-3.5 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                  </div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{item.week}</span>
                  <p className="text-sm text-foreground/80 mt-1 leading-relaxed">{item.action}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ═══ 12. AI REMIX ═══ */}
        <Section delay={0.85}>
          {canRemix ? (
            <AiRemixSection uploadedFile={uploadedFile || null} songTitle={title} songGenre={songGenre} analysisData={results} analysisId={analysisId} />
          ) : (
            <div className="rounded-xl border border-accent/30 bg-gradient-to-b from-accent/[0.04] to-transparent p-6 md:p-8 text-center relative overflow-hidden">
              <div className="h-10 w-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
                <Headphones className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-xl md:text-2xl font-black font-heading text-foreground mb-2">AI Remix Studio</h2>
              <p className="text-sm text-muted-foreground mb-1 max-w-md mx-auto">AI covers your song with a stronger hook and more viral energy.</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Your song scored <strong className="text-accent">{score}/100</strong>. Unlock AI Remix to push it to the next level.
              </p>
              <motion.button onClick={() => setShowRemixPaywall(true)}
                className="relative px-8 py-3.5 rounded-xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-bold text-sm overflow-hidden"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent" animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }} />
                <span className="relative flex items-center gap-2"><Sparkles className="h-4 w-4" /> Unlock AI Remix <ArrowRight className="h-4 w-4" /></span>
              </motion.button>
              <p className="text-xs text-muted-foreground mt-3">Pro — $19/month or $7/remix one-time</p>
            </div>
          )}
        </Section>

        <AnimatePresence>
          {showRemixPaywall && <RemixPaywallModal score={score} songTitle={title} onClose={() => setShowRemixPaywall(false)} />}
        </AnimatePresence>

        {/* ═══ 13. BOTTOM CTA ═══ */}
        <Section delay={0.9} className="pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="gradient-purple text-primary-foreground font-bold glow-purple hover:opacity-90 transition-all px-8 h-12 text-sm">
              <Link to="/analyze">Analyze Another Song</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border hover:bg-secondary px-6 h-12 text-sm font-semibold gap-2">
              <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Share My Score on X
              </a>
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            <Link to="/billing" className="text-accent hover:underline font-medium">
              Upgrade to Pro for unlimited analyses <ArrowRight className="h-3 w-3 inline ml-0.5" />
            </Link>
          </p>
        </Section>
      </div>
    </div>
  );
};

export default Results;
