import { useLocation, Link, Navigate, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, AnimatePresence, useInView } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_LIMITS } from "@/lib/supabase";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { saveRemixesToLocalStorage } from "@/lib/remixStorage";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Check, X, Target, ListMusic, Lightbulb, Clock, Activity, Zap,
  Headphones, Music, User, AlertTriangle, KeyRound, MapPin,
  ArrowRight, ChevronRight, Download, Share2, Upload, Play, Pause, Loader2, Copy, Sparkles, Shield,
  BarChart3, TrendingUp, Radio, Mic2, FileText, Calendar, Award, Eye, CheckCircle2,
  Flame, ArrowUpRight, Crosshair, Layers, Gauge, CircleDot, ChevronDown, Star, Rocket
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
  <svg viewBox="0 0 361 361" className={className}>
    <defs>
      <linearGradient id="apple-music-grad" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#FA233B" />
        <stop offset="100%" stopColor="#FB5C74" />
      </linearGradient>
    </defs>
    <rect width="361" height="361" rx="80" fill="url(#apple-music-grad)" />
    <path d="M255 96.5v131.3c0 15.1-10.4 28.2-25.1 32.1-5.3 1.4-10.9 1.7-16.3.9-14.6-2.2-25.1-14-25.1-28.2 0-15.8 13.6-28.5 30.4-28.5 5.5 0 10.7 1.3 15.2 3.7V137l-96 22.5v108.3c0 15.1-10.4 28.2-25.1 32.1-5.3 1.4-10.9 1.7-16.3.9-14.6-2.2-25.1-14-25.1-28.2 0-15.8 13.6-28.5 30.4-28.5 5.5 0 10.7 1.3 15.2 3.7V128.5c0-8.5 5.8-15.9 14-18l91.8-21.5c11.5-2.7 21.9 5.7 21.9 17.3v-9.8z" fill="#fff"/>
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
      style={{ borderColor: `${c.color}22`, backgroundColor: `${c.color}0D`, color: c.color }}
    >
      {c.icon}
      {c.label}
    </span>
  );
};

/* ─── Score helpers ─── */
const scoreColor = (s: number) => {
  if (s < 40) return "hsl(0 84% 60%)";
  if (s < 65) return "hsl(25 95% 53%)";
  if (s < 80) return "hsl(142 71% 45%)";
  return "hsl(270 91% 65%)";
};

const scoreBadge = (s: number) => {
  if (s < 40) return { label: "LOW POTENTIAL", cls: "bg-red-500/15 text-red-400 border-red-500/30" };
  if (s < 65) return { label: "MEDIUM POTENTIAL", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" };
  if (s < 80) return { label: "HIGH POTENTIAL", cls: "bg-green-500/15 text-green-400 border-green-500/30" };
  return { label: "HIT POTENTIAL", cls: "bg-primary/15 text-primary border-primary/30" };
};

const confidenceFromScore = (s: number) => {
  if (s >= 80) return 94;
  if (s >= 65) return 87;
  if (s >= 40) return 78;
  return 65;
};

const percentileFromScore = (s: number) => Math.min(99, Math.max(5, Math.round(s * 0.95 + 3)));

/* ─── Score Gauge (mobile-optimized) ─── */
const ScoreGauge = ({ score }: { score: number }) => {
  const r = 80;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const ctrl = animate(count, score, { duration: 2, ease: [0.16, 1, 0.3, 1] });
    return ctrl.stop;
  }, [count, score]);

  return (
    <motion.div
      className="relative flex items-center justify-center w-[180px] h-[180px] md:w-[220px] md:h-[220px]"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <svg width="100%" height="100%" viewBox="0 0 180 180" className="-rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="5" strokeOpacity="0.2" />
        <motion.circle
          cx="90" cy="90" r={r} fill="none"
          stroke="url(#scoreGradV2)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
        />
        <defs>
          <linearGradient id="scoreGradV2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={score >= 80 ? "hsl(290 80% 60%)" : color} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <motion.div
          className="text-5xl md:text-6xl font-black tabular-nums font-heading"
          style={{ color }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 1.5 }}
        >
          {rounded}
        </motion.div>
        <motion.div
          className="text-[10px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-[0.2em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          Viral Score
        </motion.div>
      </div>
    </motion.div>
  );
};

/* ─── DNA Bar (compact mobile) ─── */
const DNABar = ({ label, value, max, explanation, delay = 0 }: { label: string; value: number; max: number; explanation: string; delay?: number }) => {
  const pct = Math.min((value / max) * 100, 100);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });
  const color = pct >= 80 ? "hsl(270 91% 65%)" : pct >= 60 ? "hsl(142 71% 45%)" : pct >= 40 ? "hsl(38 92% 50%)" : "hsl(0 84% 60%)";
  return (
    <motion.div
      ref={ref}
      className="p-3.5 rounded-xl border border-border bg-card/50"
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: delay * 0.05, duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-bold text-foreground">{label}</span>
        <motion.span className="text-base font-black tabular-nums" style={{ color }}
          initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: delay * 0.05 + 0.15 }}>
          {value}<span className="text-[10px] text-muted-foreground font-normal">/{max}</span>
        </motion.span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden mb-1.5">
      <motion.div className="h-full rounded-full will-change-transform"
          initial={{ scaleX: 0 }} animate={isInView ? { scaleX: pct / 100 } : { scaleX: 0 }}
          style={{ backgroundColor: color, transformOrigin: "left" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: delay * 0.05 }} />
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{explanation}</p>
    </motion.div>
  );
};

/* ─── Section wrapper (reduced delays) ─── */
const Section = ({ children, delay = 0, className = "", id }: { children: ReactNode; delay?: number; className?: string; id?: string }) => (
  <motion.section
    id={id}
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ delay: Math.min(delay * 0.05, 0.3), duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.section>
);

const SectionLabel = ({ title, icon: Icon }: { title: string; icon: React.ElementType }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <h2 className="text-base md:text-lg font-black font-heading text-foreground tracking-tight">{title}</h2>
  </div>
);

/* ─── Sticky Section Nav ─── */
const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "issues", label: "Issues" },
  { id: "improve", label: "Improve" },
  { id: "compare", label: "Compare" },
  { id: "roadmap", label: "Roadmap" },
];

const StickyNav = ({ activeSection }: { activeSection: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.5 }}
    className="sticky top-[88px] md:top-[96px] z-30 -mx-4 px-4 py-2 bg-background/90 backdrop-blur-lg border-b border-border/50"
  >
    <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-2xl mx-auto">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeSection === item.id
              ? "bg-primary/15 text-primary border border-primary/25"
              : "text-muted-foreground hover:text-foreground border border-transparent"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  </motion.div>
);

/* ─── Floating CTA (proper spacing, no overlap) ─── */
const FloatingCTA = ({ onClick }: { onClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 2, type: "spring", stiffness: 200, damping: 25 }}
    className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-auto z-40 md:bottom-8"
  >
    <motion.button
      onClick={onClick}
      className="relative w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-bold text-sm overflow-hidden shadow-lg shadow-accent/20"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
    >
      <span className="relative flex items-center justify-center gap-2">
        <Rocket className="h-4 w-4" />
        Make This Track Viral
        <ArrowRight className="h-4 w-4" />
      </span>
    </motion.button>
  </motion.div>
);

/* ─── Critical Issue Card ─── */
const CriticalIssueCard = ({ title, why, fix, impact, index }: { title: string; why: string; fix: string; impact: string; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.06, duration: 0.35 }}
    className="rounded-xl border border-red-500/15 bg-gradient-to-br from-red-500/[0.03] to-transparent p-5 space-y-3 hover:border-red-500/25 transition-colors"
  >
    <div className="flex items-start gap-3">
      <div className="mt-0.5 h-6 w-6 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
      </div>
      <h3 className="text-base font-bold text-foreground leading-snug">{title}</h3>
    </div>
    <div className="pl-9 space-y-2.5">
      <div>
        <p className="text-[10px] text-red-400/70 font-bold uppercase tracking-widest mb-0.5">Why It Matters</p>
        <p className="text-sm text-foreground/70 leading-relaxed">{why}</p>
      </div>
      <div>
        <p className="text-[10px] text-green-400/70 font-bold uppercase tracking-widest mb-0.5">What To Change</p>
        <p className="text-sm text-green-300/90 leading-relaxed">{fix}</p>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <div className="h-1.5 w-1.5 rounded-full bg-accent" />
        <p className="text-xs text-accent font-medium">{impact}</p>
      </div>
    </div>
  </motion.div>
);

/* ─── Opportunity Card ─── */
const OpportunityCard = ({ label, description, priority, impact, icon: Icon, color }: { label: string; description: string; priority: string; impact: string; icon: React.ElementType; color: string }) => (
  <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors">
    <div className="flex items-center gap-2 mb-2">
      <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15`, borderColor: `${color}25`, borderWidth: 1 }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{label}</p>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border" style={{ color, borderColor: `${color}30`, backgroundColor: `${color}08` }}>{priority}</span>
    </div>
    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{description}</p>
    <div className="flex items-center gap-1.5">
      <TrendingUp className="h-3 w-3 text-accent" />
      <span className="text-xs text-accent font-semibold">{impact}</span>
    </div>
  </div>
);

/* ─── Benchmark Bar (GPU-friendly) ─── */
const BenchmarkBar = ({ label, yours, benchmark, delay = 0 }: { label: string; yours: number; benchmark: number; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const diff = yours - benchmark;
  const diffLabel = diff >= 0 ? `+${diff}` : `${diff}`;
  const diffColor = diff >= 0 ? "text-green-400" : "text-red-400";
  return (
    <div ref={ref} className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className={`font-bold tabular-nums ${diffColor}`}>{diffLabel}%</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground w-14 flex-shrink-0">You</span>
          <div className="h-2 rounded-full bg-muted flex-1 overflow-hidden">
            <motion.div className="h-full rounded-full bg-primary will-change-transform" style={{ transformOrigin: "left" }} initial={{ scaleX: 0 }} animate={isInView ? { scaleX: yours / 100 } : {}} transition={{ duration: 0.8, delay: delay * 0.08 }} />
          </div>
          <span className="text-xs font-bold text-foreground tabular-nums w-8 text-right">{yours}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground w-14 flex-shrink-0">Top Tracks</span>
          <div className="h-2 rounded-full bg-muted flex-1 overflow-hidden">
            <motion.div className="h-full rounded-full bg-accent/60 will-change-transform" style={{ transformOrigin: "left" }} initial={{ scaleX: 0 }} animate={isInView ? { scaleX: benchmark / 100 } : {}} transition={{ duration: 0.8, delay: delay * 0.08 + 0.1 }} />
          </div>
          <span className="text-xs font-bold text-accent tabular-nums w-8 text-right">{benchmark}%</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Roadmap ─── */
const generateRoadmap = (score: number, improvements: string[]) => {
  const steps: { step: string; action: string; done: boolean }[] = [];
  if (improvements?.length > 0) {
    steps.push({ step: "Step 1", action: improvements[0] || "Fix the primary issue identified above.", done: false });
    if (improvements.length > 1) steps.push({ step: "Step 2", action: improvements[1], done: false });
  }
  if (score < 80) {
    steps.push({ step: `Step ${steps.length + 1}`, action: "Re-analyze your track after changes to verify improvement.", done: false });
  }
  steps.push({ step: `Step ${steps.length + 1}`, action: score >= 80 ? "Your track is release-ready. Begin distribution and playlist pitching." : "Once score reaches 80+, proceed with release strategy.", done: false });
  return steps;
};

/* ─── Remix styles ─── */
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
    a.href = blobUrl; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch { window.open(url, '_blank'); }
};

const ProcessingWaveform = () => (
  <div className="flex items-end justify-center gap-1 h-10">
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div key={i} className="w-1 rounded-full bg-gradient-to-t from-accent to-yellow-300 will-change-transform"
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
      setFeedLines(prev => [...prev, remixDataFeedLines[prev.length % remixDataFeedLines.length]].slice(-6));
      setDataPoints(prev => ({
        tracks: Math.min(prev.tracks + Math.floor(Math.random() * 1200 + 300), 100000),
        patterns: Math.min(prev.patterns + Math.floor(Math.random() * 40 + 10), 5000),
        signals: Math.min(prev.signals + Math.floor(Math.random() * 20 + 5), 2500),
      }));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight; }, [feedLines]);

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
      <div className="text-center space-y-3">
        <ProcessingWaveform />
        <div><p className="text-base font-bold text-foreground">{currentStep.label}</p><p className="text-xs text-muted-foreground mt-0.5">{currentStep.detail}</p></div>
      </div>
      <div className="max-w-sm mx-auto space-y-1.5">
        <div className="flex justify-between text-[10px] text-muted-foreground font-medium tabular-nums"><span>{elapsed}s elapsed</span><span>{progress}%</span></div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-accent via-yellow-400 to-primary will-change-transform" style={{ transformOrigin: "left" }} initial={{ scaleX: 0 }} animate={{ scaleX: progress / 100 }} transition={{ duration: 0.5 }} />
        </div>
      </div>
      <div className="max-w-md mx-auto space-y-1">
        {remixPlatformSteps.slice(0, currentStepIdx + 1).map((step, i) => {
          const isDone = i < currentStepIdx;
          const isCurrent = i === currentStepIdx;
          return (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
              className={`flex items-center gap-2.5 py-1 px-3 rounded-lg text-xs ${isCurrent ? 'bg-accent/10 border border-accent/20' : ''}`}>
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {isDone ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <PlatformIcon type={step.icon} />}
              </div>
              <span className={`flex-1 ${isCurrent ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                {step.platform && <span className="font-semibold">{step.platform} — </span>}{step.label}
              </span>
              {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
            </motion.div>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
        {[{ label: "Tracks Scanned", value: dataPoints.tracks.toLocaleString() }, { label: "Patterns Found", value: dataPoints.patterns.toLocaleString() }, { label: "Signals Mapped", value: dataPoints.signals.toLocaleString() }].map(stat => (
          <div key={stat.label} className="text-center py-2 px-1 rounded-lg bg-card border border-border">
            <p className="text-sm font-bold text-foreground tabular-nums">{stat.value}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="max-w-md mx-auto">
        <div ref={feedRef} className="rounded-lg bg-background border border-border p-3 h-28 overflow-y-auto font-mono text-[10px] space-y-1 scrollbar-thin">
          {feedLines.map((line, i) => (
            <motion.div key={`${i}-${line}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground">
              <span className="text-emerald-400/70">▸</span> {line}
            </motion.div>
          ))}
          <span className="text-accent inline-block animate-pulse">_</span>
        </div>
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
            <label className="text-sm font-bold text-foreground flex items-center gap-2"><Mic2 className="h-4 w-4 text-primary" /> Song Lyrics</label>
            {improved && (
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowDiff(!showDiff); if (!showDiff) setApplyImproved(false); }} className="text-xs px-3 py-1 rounded-md border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
                  {showDiff ? "Hide comparison" : "Compare versions"}
                </button>
                <button onClick={() => { setApplyImproved(!applyImproved); setShowDiff(false); }}
                  className={`text-xs px-3 py-1 rounded-md border transition-all flex items-center gap-1.5 ${applyImproved ? "bg-primary/20 border-primary/40 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
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
            <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)}
              placeholder={original ? "Your song lyrics..." : "Paste your song lyrics here..."}
              className="w-full h-40 bg-muted/50 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 transition-colors font-mono" />
          )}
        </div>
      </div>
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-foreground flex items-center gap-2"><Lightbulb className="h-4 w-4 text-accent" /> AI Recommendations</p>
          {recommendations.map(rec => (
            <motion.div key={rec.id} layout
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${rec.applied ? "bg-primary/10 border-primary/30" : "bg-card border-border hover:border-muted-foreground/30"}`}
              onClick={() => setRecommendations(prev => prev.map(r => r.id === rec.id ? {...r, applied: !r.applied} : r))}>
              <div className={`mt-0.5 flex-shrink-0 w-8 h-4 rounded-full relative transition-colors ${rec.applied ? "bg-primary" : "bg-muted"}`}>
                <motion.div className="absolute top-0.5 w-3 h-3 rounded-full bg-foreground shadow-md" animate={{ left: rec.applied ? 16 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
              </div>
              <p className="text-sm text-foreground/80 flex-1">{rec.text}</p>
            </motion.div>
          ))}
        </div>
      )}
      <motion.button onClick={() => onLyricsReady(buildFinalLyrics())}
        className="relative w-full py-3.5 rounded-xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-bold text-sm overflow-hidden"
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <span className="relative flex items-center justify-center gap-2"><Sparkles className="h-4 w-4" /> Create AI Remix with These Lyrics <ArrowRight className="h-4 w-4" /></span>
      </motion.button>
    </div>
  );
};

/* ─── AI Remix Section ─── */
const AiRemixSection = ({
  uploadedFile, existingS3Key, songTitle, songGenre, analysisData, analysisId
}: {
  uploadedFile: File | null;
  existingS3Key?: string;
  songTitle: string;
  songGenre?: string;
  analysisData?: any;
  analysisId?: string;
}) => {
  const { user } = useAuth();
  const { playTrack } = useAudioPlayer();
  const LAMBDA_URL = "https://u2yjblp3w5.execute-api.eu-west-1.amazonaws.com/prod/analyze";

  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "complete" | "error">("idle");
  const [style, setStyle] = useState("same");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [file, setFile] = useState<File | null>(uploadedFile);
  const [lyrics, setLyrics] = useState<string>(analysisData?.originalLyrics || "");
  const [playing, setPlaying] = useState<number | null>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  const canCreate = !!(file || existingS3Key);

  const startRemix = async () => {
    if (!user) { toast.error("Sign in to create remixes"); return; }
    if (!canCreate) { toast.error("No audio file. Please re-upload."); return; }

    setStatus("uploading");
    setElapsed(0);
    setError("");

    try {
      // Step 1 — get S3 key (reuse existing or upload fresh)
      let s3Key = existingS3Key || "";
      if (!s3Key && file) {
        const urlRes = await fetch(LAMBDA_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get-upload-url", filename: file.name, contentType: file.type || "audio/mpeg" }),
        });
        if (!urlRes.ok) throw new Error("Failed to get upload URL");
        const urlData = await urlRes.json();
        s3Key = urlData.s3Key;
        const putRes = await fetch(urlData.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type || "audio/mpeg" }, body: file });
        if (!putRes.ok) throw new Error("File upload failed");
      }

      setStatus("processing");
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

      // Step 2 — call suno-cover with FULL analysis data + user lyrics
      const fullAnalysis = {
        ...(analysisData || {}),
        customLyrics: lyrics.trim() || undefined,
      };
      const coverRes = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "suno-cover",
          s3Key,
          title: songTitle,
          genre: songGenre || analysisData?.genre || "pop",
          style,
          analysisData: fullAnalysis,
        }),
      });
      const coverData = await coverRes.json();
      if (coverData.error) throw new Error(coverData.error);
      const { taskIdV1, taskIdV2, version1, version2 } = coverData;
      if (!taskIdV1 || !taskIdV2) throw new Error("No task IDs returned from Suno");

      // Step 3 — poll until both versions are ready
      let attempts = 0;
      const poll = async (): Promise<any> => {
        if (attempts++ > 40) throw new Error("Remix timed out. Please try again.");
        const pollRes = await fetch(LAMBDA_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "suno-cover", taskIdV1, taskIdV2 }),
        });
        const data = await pollRes.json();
        if (data.status === "complete") return data;
        if (data.status === "failed" || data.error) throw new Error(data.error || "Remix failed");
        await new Promise(r => setTimeout(r, 8000));
        return poll();
      };

      const finalData = await poll();
      clearInterval(timerRef.current);

      // Build tracks
      const tracks: any[] = [];
      if (finalData.v1?.audioUrl) tracks.push({
        audioUrl: finalData.v1.audioUrl,
        imageUrl: finalData.v1.imageUrl,
        label: version1?.label || "Faithful Remix",
        description: version1?.description || "Production-upgraded, preserves original vibe",
        accent: "blue",
      });
      if (finalData.v2?.audioUrl) tracks.push({
        audioUrl: finalData.v2.audioUrl,
        imageUrl: finalData.v2.imageUrl,
        label: version2?.label || "Viral Edition",
        description: version2?.description || "Trend-forward, maximum chart impact",
        accent: "purple",
      });

      // ── 1. Build localStorage entries (bulletproof backup, always works) ──
      const localEntries = tracks.map((track: any, i: number) => ({
        id: `local_${Date.now()}_${i}`,
        remix_title: track.label || 'AI Remix',
        original_title: songTitle || null,
        audio_url: track.audioUrl,
        image_url: track.imageUrl || null,
        genre: songGenre || analysisData?.genre || null,
        created_at: new Date().toISOString(),
        analysis_id: analysisId || null,
        suno_task_id: taskIdV1,
        description: track.description,
        accent: track.accent,
      }));
      if (user) saveRemixesToLocalStorage(user.id, localEntries);

      // ── 2. Auto-play first track via AudioPlayerContext → bottom player appears ──
      if (tracks[0]?.audioUrl) {
        playTrack({
          id: `remix_${Date.now()}_0`,
          title: `${songTitle || 'AI Song'} – ${tracks[0].label || 'Remix'}`,
          audioUrl: tracks[0].audioUrl,
          imageUrl: tracks[0].imageUrl || undefined,
          sourceTitle: songTitle || undefined,
        });
      }

      // ── 3. Save to Supabase (async, non-blocking) ──
      if (user && tracks.length > 0) {
        let savedCount = 0;
        for (const track of tracks) {
          try {
            const { error: saveErr } = await supabase.from("viralize_remixes").insert({
              user_id: user.id,
              analysis_id: analysisId || null,
              audio_url: track.audioUrl,
              image_url: track.imageUrl || null,
              suno_task_id: taskIdV1,
              genre: songGenre || analysisData?.genre || null,
              original_title: songTitle || null,
              remix_title: track.label || 'AI Remix',
              status: 'complete',
            });
            if (!saveErr) savedCount++;
            else console.warn('Supabase save error:', saveErr.message, saveErr.code);
          } catch (e) {
            console.warn('Supabase save exception:', e);
          }
        }
        if (savedCount > 0) {
          toast.success(`✅ ${savedCount} song${savedCount > 1 ? 's' : ''} saved to your library!`, {
            action: { label: 'View Library', onClick: () => window.location.href = '/library' }
          });
        } else {
          toast.info('Songs ready! Saved locally — find them in your Library.', {
            action: { label: 'View Library', onClick: () => window.location.href = '/library' }
          });
        }
      }

      setResult({ tracks });
      setStatus("complete");
    } catch (e: any) {
      clearInterval(timerRef.current);
      setError(e.message || "Remix failed. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div id="viral-cta" className="rounded-2xl border border-accent/20 bg-gradient-to-b from-accent/[0.04] to-transparent p-5 md:p-6 relative overflow-hidden scroll-mt-24">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Rocket className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-black font-heading text-foreground">Make This Track Viral</h2>
          <p className="text-xs text-muted-foreground">Apply proven patterns from high-performing tracks</p>
        </div>
      </div>

      {/* ── IDLE FORM ── */}
      {status === "idle" && (
        <div className="space-y-4">

          {/* File indicator / re-upload */}
          {existingS3Key ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-300 font-medium">Audio file ready from your scan ✓</p>
            </div>
          ) : file ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <Music className="h-4 w-4 text-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button onClick={() => setFile(null)} className="text-xs text-muted-foreground hover:text-foreground">Change</button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
              <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Upload your audio file</p>
              <label className="inline-block cursor-pointer">
                <span className="px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">Choose File</span>
                <input type="file" accept="audio/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
              </label>
            </div>
          )}

          {/* Style selector */}
          <div>
            <label className="text-sm font-bold text-foreground mb-1.5 block">Remix Style</label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {remixStyles.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* ── LYRICS — always visible, no separate window ── */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Mic2 className="h-4 w-4 text-primary" />
                  Your Lyrics
                  <span className="text-[10px] text-muted-foreground font-normal">(edit here — goes directly to AI)</span>
                </label>
                <div className="flex gap-1.5">
                  {analysisData?.originalLyrics && (
                    <button
                      onClick={() => setLyrics(analysisData.originalLyrics)}
                      className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors"
                    >
                      Original
                    </button>
                  )}
                  {analysisData?.improvedLyrics && (
                    <button
                      onClick={() => setLyrics(analysisData.improvedLyrics)}
                      className="text-[10px] px-2 py-1 rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="h-2.5 w-2.5" /> AI-improved
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="Your song lyrics appear here automatically from the scan. Edit freely — these exact lyrics will be sent to the AI remix engine."
                className="w-full h-40 bg-muted/50 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 transition-colors font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5 pb-2">
                {lyrics.length > 0 ? `✓ ${lyrics.length} characters — will be sent to AI` : "No lyrics yet — AI will generate from your song analysis"}
              </p>
            </div>
          </div>

          {/* Create button */}
          <motion.button
            onClick={startRemix}
            disabled={!canCreate}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            whileHover={canCreate ? { scale: 1.01 } : {}}
            whileTap={canCreate ? { scale: 0.98 } : {}}
          >
            <Rocket className="h-4 w-4" />
            {lyrics.trim() ? "Create AI Remix with My Lyrics" : "Create AI Remix"}
          </motion.button>
        </div>
      )}

      {/* ── UPLOADING ── */}
      {status === "uploading" && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 text-accent mx-auto animate-spin mb-3" />
          <p className="text-sm font-medium text-foreground">Uploading your track...</p>
          <p className="text-xs text-muted-foreground mt-1">Preparing audio for AI analysis</p>
        </div>
      )}

      {/* ── PROCESSING ── */}
      {status === "processing" && <RemixProcessingUI elapsed={elapsed} />}

      {/* ── ERROR ── */}
      {status === "error" && (
        <div className="text-center py-6 space-y-3">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button onClick={() => { setStatus("idle"); setError(""); }} variant="outline" className="gap-2 border-border">
            Try Again
          </Button>
        </div>
      )}

      {/* ── COMPLETE — 2 versions ── */}
      {status === "complete" && result?.tracks?.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <h3 className="text-base font-bold text-foreground">🎉 Your AI Songs Are Ready!</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Two unique versions — playing automatically below ↓</p>
            </div>
            <Link
              to="/library"
              className="text-xs text-primary hover:text-primary/80 border border-primary/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 flex-shrink-0 ml-3"
            >
              <Headphones className="h-3.5 w-3.5" />
              My Library
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.tracks.map((track: any, i: number) => (
              <div
                key={i}
                className={`rounded-xl border p-4 ${i === 0 ? "border-blue-500/30 bg-blue-500/5" : "border-purple-500/30 bg-purple-500/5"}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{i === 0 ? "🎸" : "🚀"}</span>
                  <div>
                    <p className={`text-sm font-bold ${i === 0 ? "text-blue-300" : "text-purple-300"}`}>{track.label}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{track.description}</p>
                  </div>
                </div>
                {track.imageUrl && (
                  <img src={track.imageUrl} alt={track.label} className="w-full h-28 object-cover rounded-lg mb-3" />
                )}
                {/* Play button → triggers bottom AudioPlayer */}
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => {
                      playTrack({
                        id: `remix_${Date.now()}_${i}`,
                        title: `${songTitle || 'AI Song'} – ${track.label || 'Remix'}`,
                        audioUrl: track.audioUrl,
                        sourceTitle: songTitle || undefined,
                      });
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all
                      ${i === 0
                        ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30'
                        : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30'
                      }`}
                  >
                    <Play className="h-4 w-4" />
                    Play Now
                  </button>
                  <a
                    href={track.audioUrl}
                    download={`${songTitle}_${(track.label || 'remix').replace(/\s+/g, "_")}.mp3`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> MP3
                  </a>
                </div>
                {/* Native audio as fallback */}
                <audio
                  ref={el => { audioRefs.current[i] = el; }}
                  src={track.audioUrl}
                  className="w-full h-8 opacity-50 hover:opacity-100 transition-opacity"
                  controls
                  onPlay={() => {
                    audioRefs.current.forEach((a, idx) => { if (a && idx !== i) a.pause(); });
                    setPlaying(i);
                  }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => { setStatus("idle"); setResult(null); setError(""); }}
            className="w-full py-2 text-xs text-muted-foreground hover:text-foreground border border-border/30 rounded-lg transition-colors"
          >
            ↩ Create another version
          </button>
        </div>
      )}
    </div>
  );
};


/* ═══════════════════════════════════════════════
   MAIN RESULTS PAGE
   ═══════════════════════════════════════════════ */
const Results = () => {
  const location = useLocation();
  const _navigate = useNavigate();
  const state = location.state as { results: any; title: string; goal?: string; uploadedFile?: File; songGenre?: string; analysisId?: string; s3Key?: string } | null;

  if (!state?.results) return <Navigate to="/analyze" replace />;

  const { user, profile } = useAuth();
  const [showRemixPaywall, setShowRemixPaywall] = useState(false);
  const plan = (profile?.plan ?? 'free') as keyof typeof PLAN_LIMITS;
  const analysesUsed = profile?.analyses_used ?? 0;
  const analysesLimit = PLAN_LIMITS[plan].analyses;
  const hasExhaustedFreeAnalysis = plan === 'free' && analysesUsed >= analysesLimit;
  const canRemix = plan !== 'free' || profile?.is_admin === true;

  const { results, title, goal, uploadedFile, songGenre, analysisId, s3Key } = state;
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
  const confidence = confidenceFromScore(score);
  const percentile = percentileFromScore(score);
  const hasViralLine = viralLine && viralLine !== "none yet";

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `My song "${title}" scored ${score}/100 on Viralize!\n\nCheck yours → viralize.app`
  )}`;

  // Derive HIT DNA scores
  const hookStrength = hookAnalysis ? Math.min(10, Math.round(score * 0.1 + (competitorMatch || 5) * 0.3 + 2)) : Math.round(score / 10);
  const replayValue = Math.min(10, Math.round((danceability || 5) * 0.5 + (valence || 5) * 0.3 + score * 0.02));
  const emotionalImpact = Math.min(10, Math.round((valence || 5) * 0.6 + (emotionalCore ? 3 : 0) + score * 0.02));
  const structureQuality = Math.min(10, Math.round(score * 0.08 + (hookTiming ? 2 : 0) + 1));
  const marketFit = competitorMatch || Math.min(10, Math.round(score * 0.09 + 1));
  const algorithmCompat = Math.min(10, Math.round((danceability || 5) * 0.3 + (valence || 5) * 0.2 + score * 0.04));

  // Critical issues
  const criticalIssues = (improvements || []).slice(0, 4).map((imp: string, i: number) => {
    const isHook = imp.toLowerCase().includes('hook');
    const isEnergy = imp.toLowerCase().includes('energy') || imp.toLowerCase().includes('dynamic');
    const isStructure = imp.toLowerCase().includes('structure') || imp.toLowerCase().includes('section');
    const isLyric = imp.toLowerCase().includes('lyric') || imp.toLowerCase().includes('word');
    return {
      title: isHook ? "Hook Needs Optimization" : isEnergy ? "Energy Progression Issue" : isStructure ? "Structural Weakness" : isLyric ? "Lyric Impact Gap" : `Issue ${i + 1}: Improvement Needed`,
      why: isHook ? "The hook is the #1 factor in listener retention. Weak hooks cause 60%+ skip rates in the first 15 seconds." :
           isEnergy ? "Energy dynamics directly affect replay rates. Flat energy curves reduce algorithmic recommendation scores." :
           isStructure ? "Top-performing tracks follow specific structural patterns. Deviations reduce playlist placement likelihood." :
           isLyric ? "Memorable lyrics drive saves and shares. Generic phrasing reduces emotional connection and virality." :
           "This element affects how streaming algorithms rank and recommend your track to new listeners.",
      fix: imp,
      impact: isHook ? "+15-25% retention improvement" : isEnergy ? "+10-20% replay rate increase" : isStructure ? "+12-18% playlist match rate" : "+8-15% save rate improvement",
    };
  });

  // Opportunities
  const opportunities = [
    ...(strengths || []).slice(0, 2).map((s: string) => ({
      label: "Quick Win",
      description: s + " — leverage this strength in your marketing and playlist pitching.",
      priority: "Quick Win",
      impact: "+5-10% visibility",
      icon: Zap,
      color: "hsl(142 71% 45%)",
    })),
    ...(improvements || []).slice(0, 2).map((imp: string) => ({
      label: "Key Improvement",
      description: imp,
      priority: "Medium",
      impact: "+15-25% viral potential",
      icon: Target,
      color: "hsl(38 92% 50%)",
    })),
  ];
  if (oneChange) {
    opportunities.push({
      label: "Major Upgrade",
      description: oneChange,
      priority: "High Impact",
      impact: "+20-35% overall score",
      icon: Flame,
      color: "hsl(0 84% 60%)",
    });
  }

  // Benchmarks
  const benchmarks = [
    { label: "Hook Timing", yours: Math.round(hookStrength * 10), benchmark: 82 },
    { label: "Replay Rate", yours: Math.round(replayValue * 10), benchmark: 75 },
    { label: "Energy Dynamics", yours: Math.round(algorithmCompat * 10), benchmark: 78 },
    { label: "Structure Match", yours: Math.round(structureQuality * 10), benchmark: 85 },
    { label: "Market Fit", yours: Math.round(marketFit * 10), benchmark: 72 },
  ];

  const roadmap = generateRoadmap(score, improvements || []);

  // Strongest / weakest
  const dnaScores = [
    { label: "Hook Strength", value: hookStrength },
    { label: "Replay Value", value: replayValue },
    { label: "Emotional Impact", value: emotionalImpact },
    { label: "Structure", value: structureQuality },
    { label: "Market Fit", value: marketFit },
    { label: "Algorithm Fit", value: algorithmCompat },
  ];
  const sorted = [...dnaScores].sort((a, b) => b.value - a.value);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  // Active section tracking
  const [activeSection, setActiveSection] = useState("overview");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    const timer = setTimeout(() => {
      NAV_ITEMS.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) observer.observe(el);
      });
    }, 500);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);

  const scrollToViral = () => {
    document.getElementById("viral-cta")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen px-4 pt-28 pb-32 bg-background relative">
      {/* Sticky Mini Nav */}
      <StickyNav activeSection={activeSection} />

      {/* Floating CTA */}
      <FloatingCTA onClick={scrollToViral} />

      <div className="max-w-2xl mx-auto space-y-6 relative z-10">

        {/* ═══ 1. HERO — Score + Verdict ═══ */}
        <Section delay={0} id="overview">
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <div className="flex flex-col items-center text-center">
              <ScoreGauge score={score} />

              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, type: "spring" }}
                className={`mt-3 inline-block px-4 py-1.5 rounded-full text-[11px] font-black border uppercase tracking-[0.12em] ${badge.cls}`}
              >
                {badge.label}
              </motion.span>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="flex items-center gap-2 mt-2 text-xs text-muted-foreground"
              >
                <span>Confidence: <strong className="text-foreground">{confidence}%</strong></span>
                <span className="text-border">•</span>
                <span>{isRealAudio ? "Audio Analysis" : "Pattern Analysis"}</span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7 }}
                className="text-base md:text-lg font-bold text-foreground leading-snug mt-4 max-w-md"
              >
                {verdict || (score >= 80
                  ? "Strong viral potential. Minor tweaks could make this a hit."
                  : score >= 65
                  ? "Good foundation, but key issues are limiting performance."
                  : score >= 40
                  ? "Potential is there. Several areas need improvement before release."
                  : "This track needs significant work before it's ready.")}
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.9 }}
                className="text-xs text-muted-foreground mt-2"
              >
                "{title}" {songGenre ? `• ${songGenre}` : ''}
              </motion.p>

              {/* Share row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.1 }}
                className="flex gap-2 mt-4"
              >
                <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border h-8"
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/results?shared=true&score=${score}&title=${encodeURIComponent(title)}`); toast.success("Copied!"); }}>
                  <Copy className="h-3 w-3" /> Copy
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border h-8"
                  onClick={() => window.open(tweetUrl, '_blank')}>
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Share
                </Button>
              </motion.div>
            </div>

            {/* Hidden share card */}
            <div className="sr-only" aria-hidden="true">
              <div id="share-score-card" className="w-[400px] bg-[#0a0a0a] p-6 rounded-2xl border border-primary/20">
                <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-3">viralize.app</p>
                <p className="text-foreground font-bold text-lg">{title}</p>
                <p className="text-5xl font-black mt-2" style={{ color: scoreColor(score) }}>{score}</p>
                <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-black border ${badge.cls}`}>{badge.label}</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══ Paywall ═══ */}
        {user && hasExhaustedFreeAnalysis && (
          <Section delay={1}>
            <div className="rounded-xl border border-primary/30 bg-primary/[0.06] p-6 text-center space-y-3">
              <p className="text-sm font-bold text-primary">🔒 Upgrade to unlock full analysis</p>
              <p className="text-xs text-muted-foreground">Your score: {score}/100 — Get detailed insights with a Pro plan</p>
              <a href="/pricing" className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition">View Plans</a>
            </div>
          </Section>
        )}

        {/* ═══ 2. SNAPSHOT ═══ */}
        <Section delay={2}>
          <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4 text-center mb-3">
            <motion.p className="text-3xl font-black text-primary tabular-nums"
              initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ type: "spring" }}>
              Top {100 - percentile}%
            </motion.p>
            <p className="text-sm text-foreground mt-0.5">You outperform <strong>{percentile}%</strong> of analyzed tracks</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-green-500/20 bg-green-500/[0.03] p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Strongest</span>
              </div>
              <p className="text-sm font-bold text-foreground">{strongest.label}</p>
              <p className="text-xs text-muted-foreground">{strongest.value}/10</p>
            </div>
            <div className="rounded-xl border border-red-500/15 bg-red-500/[0.03] p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Weakest</span>
              </div>
              <p className="text-sm font-bold text-foreground">{weakest.label}</p>
              <p className="text-xs text-muted-foreground">{weakest.value}/10</p>
            </div>
          </div>
        </Section>

        {/* ═══ 3. HIT DNA ═══ */}
        <Section delay={3}>
          <SectionLabel title="Hit DNA Breakdown" icon={Layers} />
          <div className="space-y-2.5">
            <DNABar label="Hook Strength" value={hookStrength} max={10} explanation={hookAnalysis || "How catchy and memorable your hook is."} delay={0} />
            <DNABar label="Replay Value" value={replayValue} max={10} explanation="How likely listeners are to hit replay." delay={1} />
            <DNABar label="Emotional Impact" value={emotionalImpact} max={10} explanation={emotionalCore || "The emotional connection your track creates."} delay={2} />
            <DNABar label="Structure Quality" value={structureQuality} max={10} explanation="How your structure matches hit patterns." delay={3} />
            <DNABar label="Market Fit" value={marketFit} max={10} explanation="Alignment with current genre trends." delay={4} />
            <DNABar label="Algorithm Fit" value={algorithmCompat} max={10} explanation="Match with platform recommendation signals." delay={5} />
          </div>
        </Section>

        {/* ═══ 4. CRITICAL ISSUES ═══ */}
        {criticalIssues.length > 0 && (
          <Section delay={4} id="issues">
            <SectionLabel title="What's Holding You Back" icon={Crosshair} />
            <div className="space-y-3">
              {criticalIssues.map((issue, i) => (
                <CriticalIssueCard key={i} index={i} {...issue} />
              ))}
            </div>
            {oneChange && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-3 rounded-xl border border-accent/30 bg-accent/[0.04] p-4 text-center"
              >
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <Target className="h-3.5 w-3.5 text-accent" />
                  <span className="text-[10px] text-accent font-bold uppercase tracking-wider">Priority Fix</span>
                </div>
                <p className="text-sm font-bold text-foreground leading-snug">{oneChange}</p>
              </motion.div>
            )}
          </Section>
        )}

        {/* ═══ 5. OPPORTUNITIES ═══ */}
        {opportunities.length > 0 && (
          <Section delay={5} id="improve">
            <SectionLabel title="Opportunities" icon={Flame} />
            <div className="space-y-2.5">
              {opportunities.map((opp, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                  <OpportunityCard {...opp} />
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* ═══ 6. COMPARISON ═══ */}
        <Section delay={6} id="compare">
          <SectionLabel title="You vs Top Tracks" icon={BarChart3} />
          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
            {benchmarks.slice(0, 4).map((b, i) => (
              <BenchmarkBar key={b.label} {...b} delay={i} />
            ))}
          </div>
          {similarSongs?.length > 0 && (
            <div className="mt-3 space-y-2.5">
              {similarSongs.slice(0, 3).map((song: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card p-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                    <SpotifyLogo className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground">{song.artist}</p>
                  </div>
                  {song.streams && <span className="text-sm font-black text-accent tabular-nums flex-shrink-0">{song.streams}</span>}
                </motion.div>
              ))}
            </div>
          )}
        </Section>

        {/* ═══ 7. ROADMAP ═══ */}
        <Section delay={7} id="roadmap">
          <SectionLabel title="Your Action Plan" icon={CheckCircle2} />
          <div className="space-y-2">
            {roadmap.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5">
                <div className="mt-0.5 flex-shrink-0 h-6 w-6 rounded-full border-2 border-primary/40 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-snug">{item.action}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ═══ 8. VIRAL CTA ═══ */}
        <Section delay={8}>
          {canRemix ? (
            <AiRemixSection uploadedFile={uploadedFile || null} existingS3Key={s3Key} songTitle={title} songGenre={songGenre} analysisData={results} analysisId={analysisId} />
          ) : (
            <div id="viral-cta" className="rounded-2xl border border-accent/20 bg-gradient-to-b from-accent/[0.04] to-transparent p-6 text-center relative overflow-hidden scroll-mt-24">
              <div className="h-11 w-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
                <Rocket className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-xl font-black font-heading text-foreground mb-1.5">Ready to Upgrade This Track?</h2>
              <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                Apply proven patterns from high-performing tracks. Score: <strong className="text-accent">{score}/100</strong>
              </p>

              <motion.button onClick={() => setShowRemixPaywall(true)}
                className="relative w-full max-w-xs mx-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-bold text-sm overflow-hidden"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <span className="relative flex items-center justify-center gap-2">
                  <Rocket className="h-4 w-4" /> Make This Track Viral <ArrowRight className="h-4 w-4" />
                </span>
              </motion.button>
              <p className="text-[11px] text-muted-foreground mt-3">Pro — $19/month or $7 one-time</p>
            </div>
          )}
        </Section>

        <AnimatePresence>
          {showRemixPaywall && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowRemixPaywall(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="rounded-xl border border-primary/30 bg-card p-8 max-w-md mx-4 text-center space-y-4" onClick={e => e.stopPropagation()}>
                <p className="text-lg font-bold text-primary">🎵 Unlock AI Remix</p>
                <p className="text-sm text-muted-foreground">Upgrade to remix "{title}" (Score: {score}/100)</p>
                <a href="/pricing" className="inline-block px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition">View Plans</a>
                <button onClick={() => setShowRemixPaywall(false)} className="block mx-auto text-xs text-muted-foreground hover:text-foreground transition">Maybe later</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ 9. TRUST LAYER ═══ */}
        <Section delay={9}>
          <div className="rounded-xl border border-border bg-card/30 p-4 text-center space-y-2">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Based on patterns from top-performing tracks across major platforms.
            </p>
            <div className="flex items-center justify-center gap-3">
              <SpotifyLogo className="h-3.5 w-3.5 opacity-30" />
              <AppleMusicLogo className="h-3.5 w-3.5 opacity-30" />
              <TikTokLogo className="h-3.5 w-3.5 opacity-30" />
              <YouTubeLogo className="h-3.5 w-3.5 opacity-30" />
            </div>
            <p className="text-[9px] text-muted-foreground/40">No official integrations or partnerships implied.</p>
          </div>
        </Section>

        {/* ═══ Bottom Actions ═══ */}
        <Section delay={10} className="pb-8">
          <div className="flex flex-col items-center gap-3">
            <Button asChild size="lg" className="gradient-purple text-primary-foreground font-bold glow-purple w-full max-w-xs h-11 text-sm">
              <Link to="/analyze">Analyze Another Track</Link>
            </Button>
            <Button asChild variant="outline" className="border-border w-full max-w-xs h-10 text-sm gap-2">
              <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Share Score on X
              </a>
            </Button>
            <Link to="/billing" className="text-xs text-accent hover:underline font-medium mt-1">
              Upgrade to Pro <ArrowRight className="h-3 w-3 inline ml-0.5" />
            </Link>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default Results;
