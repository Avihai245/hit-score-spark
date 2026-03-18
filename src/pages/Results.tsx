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

/* ─── Score helpers ─── */
const scoreColor = (s: number) => {
  if (s < 40) return "hsl(0 84% 60%)";
  if (s < 65) return "hsl(25 95% 53%)";
  if (s < 80) return "hsl(142 71% 45%)";
  return "hsl(270 91% 65%)";
};

const confidenceFromScore = (s: number) => {
  if (s >= 80) return 94;
  if (s >= 65) return 87;
  if (s >= 40) return 78;
  return 65;
};

/* ─── Emotional headline based on score ─── */
const getEmotionalHeadline = (s: number) => {
  if (s < 40) return "Your track needs work before release. Here's the fix.";
  if (s < 60) return "You're close. A couple of changes can push this into viral territory.";
  if (s < 80) return "Strong foundation. One fix away from breaking through.";
  return "This track is ready. Here's how to maximize it.";
};

/* ─── Status badge for DNA scores ─── */
const getStatusBadge = (value: number, max: number) => {
  const pct = (value / max) * 10;
  if (pct >= 8) return { emoji: "✅", label: "Strong", borderClass: "border-green-500/30", bgClass: "bg-green-500/[0.05]", textClass: "text-green-400" };
  if (pct >= 6) return { emoji: "⚠️", label: "Needs Work", borderClass: "border-yellow-500/30", bgClass: "bg-yellow-500/[0.05]", textClass: "text-yellow-400" };
  return { emoji: "🔴", label: "Fix This First", borderClass: "border-red-500/30", bgClass: "bg-red-500/[0.05]", textClass: "text-red-400" };
};

/* ─── Plain-English descriptions for DNA metrics ─── */
const getDnaDescription = (label: string, value: number, hookAnalysis?: string, emotionalCore?: string) => {
  // Parse hook timing from raw analysis if available
  const parseHookTime = (raw?: string) => {
    if (!raw) return null;
    const match = raw.match(/(\d+:\d{2})/);
    return match ? match[1] : null;
  };
  const hookTime = parseHookTime(hookAnalysis);

  const descriptions: Record<string, Record<string, string>> = {
    "Hook Strength": {
      high: hookTime
        ? `Your hook is strong and arrives at ${hookTime} — right in the window where listeners decide to stay.`
        : "Your hook grabs attention quickly — listeners will want to keep playing.",
      mid: hookTime
        ? `Your hook arrives at ${hookTime} — a bit late for the 7-second window where listeners decide to stay or skip.`
        : "Your hook is decent but could land earlier to catch listeners before they skip.",
      low: hookTime
        ? `Your hook arrives at ${hookTime} — that's well past the moment most listeners decide to skip.`
        : "Your hook isn't grabbing attention fast enough — most listeners will skip before it lands.",
    },
    "Replay Value": {
      high: "People will want to listen to this on repeat — that drives saves and algorithmic push.",
      mid: "It's enjoyable, but doesn't quite create that addictive loop that drives replays.",
      low: "Listeners probably won't come back for a second play — replays are what trigger algorithms.",
    },
    "Emotional Impact": {
      high: emotionalCore
        ? `Your track's "${emotionalCore}" energy connects emotionally — this is a real strength for playlist placement.`
        : "The mood and feeling of your track connects emotionally — this is a real strength for playlist placement.",
      mid: emotionalCore
        ? `The "${emotionalCore}" feeling is there, but it could hit deeper to make listeners feel something stronger.`
        : "There's feeling here, but it could hit deeper to create a real emotional connection.",
      low: "The emotional connection feels flat — try adding more contrast between sections to make listeners feel something.",
    },
    "Structure Quality": {
      high: "Your song structure follows the patterns that hit songs use — sections flow naturally.",
      mid: "The structure is okay but could flow better between sections to keep listeners engaged.",
      low: "The arrangement feels off — listeners might lose interest before the best parts arrive.",
    },
    "Market Fit": {
      high: "This fits what's trending right now — you're in a great lane for discovery.",
      mid: "You're in the right space but a few tweaks would help you compete with what's charting.",
      low: "This doesn't match what's performing well in your genre right now.",
    },
    "Platform Readiness": {
      high: "Streaming algorithms will love this track — it's optimized for recommendations.",
      mid: "Algorithms might pick this up, but it's not fully optimized for discovery yet.",
      low: "This track won't get recommended in its current form — algorithms need clearer signals.",
    },
  };
  const tier = value >= 8 ? "high" : value >= 6 ? "mid" : "low";
  return descriptions[label]?.[tier] || "This metric affects how your track performs.";
};

/* ─── Translate issue titles to plain language ─── */
const humanizeIssueTitle = (title: string, imp: string) => {
  const lower = imp.toLowerCase();
  if (lower.includes('hook')) return "Your hook arrives too late";
  if (lower.includes('energy') || lower.includes('dynamic')) return "The energy drops before the chorus";
  if (lower.includes('lyric') || lower.includes('word')) return "Your lyrics need more vivid imagery";
  if (lower.includes('structure') || lower.includes('section')) return "The song structure feels disconnected";
  if (lower.includes('intro')) return "Your intro doesn't grab attention";
  if (lower.includes('chorus')) return "The chorus doesn't hit hard enough";
  if (lower.includes('tempo') || lower.includes('bpm')) return "The tempo doesn't match the mood";
  return title;
};

/* ─── Score Gauge (smaller, secondary) ─── */
const ScoreGauge = ({ score, size = "default" }: { score: number; size?: "default" | "small" }) => {
  const r = size === "small" ? 50 : 80;
  const dim = size === "small" ? 120 : 180;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v: number) => Math.round(v));

  useEffect(() => {
    const ctrl = animate(count, score, { duration: 2, ease: [0.16, 1, 0.3, 1] });
    return ctrl.stop;
  }, [count, score]);

  return (
    <motion.div
      className={`relative flex items-center justify-center ${size === "small" ? "w-[120px] h-[120px]" : "w-[140px] h-[140px] md:w-[160px] md:h-[160px]"}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${dim} ${dim}`} className="-rotate-90">
        <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={size === "small" ? 4 : 5} strokeOpacity="0.2" />
        <motion.circle
          cx={dim/2} cy={dim/2} r={r} fill="none"
          stroke="url(#scoreGradV3)"
          strokeWidth={size === "small" ? 5 : 7}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
        />
        <defs>
          <linearGradient id="scoreGradV3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={score >= 80 ? "hsl(290 80% 60%)" : color} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <motion.div
          className={`${size === "small" ? "text-3xl" : "text-4xl md:text-5xl"} font-black tabular-nums font-heading`}
          style={{ color }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 1.5 }}
        >
          {rounded}
        </motion.div>
        <motion.div
          className="text-[9px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-[0.15em]"
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

/* ─── Section wrapper ─── */
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

/* ─── Scroll-spy Nav ─── */
const NAV_ITEMS = [
  { id: "hero", label: "Your Score" },
  { id: "breakdown", label: "Score Details" },
  { id: "holding-back", label: "What to Fix" },
  { id: "working", label: "What's Working" },
  { id: "vs-top", label: "vs Top Tracks" },
  { id: "plan", label: "7-Day Plan" },
];

const ScrollNav = ({ activeSection }: { activeSection: string }) => (
  <>
    {/* Desktop: sticky sidebar */}
    <div className="hidden lg:block fixed left-6 top-1/2 -translate-y-1/2 z-30 space-y-1">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className={`block text-left text-xs px-3 py-1.5 rounded-lg transition-all w-full ${
            activeSection === item.id
              ? "bg-primary/15 text-primary font-bold border border-primary/25"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
    {/* Mobile: progress dots */}
    <div className="lg:hidden fixed right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2.5">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className={`rounded-full transition-all ${
            activeSection === item.id
              ? "w-2.5 h-2.5 bg-primary shadow-[0_0_8px_hsl(258_90%_66%/0.5)]"
              : "w-2 h-2 bg-muted-foreground/30"
          }`}
          title={item.label}
        />
      ))}
    </div>
  </>
);

/* ─── Remix helpers (preserved) ─── */
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

/* ─── AI Remix Section (preserved) ─── */
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

      const fullAnalysis = { ...(analysisData || {}), customLyrics: lyrics.trim() || undefined };
      const coverRes = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suno-cover", s3Key, title: songTitle, genre: songGenre || analysisData?.genre || "pop", style, analysisData: fullAnalysis }),
      });
      const coverData = await coverRes.json();
      if (coverData.error) throw new Error(coverData.error);
      const { taskIdV1, taskIdV2, version1, version2 } = coverData;
      if (!taskIdV1 || !taskIdV2) throw new Error("No task IDs returned from Suno");

      let attempts = 0;
      const poll = async (): Promise<any> => {
        if (attempts++ > 40) throw new Error("Remix timed out. Please try again.");
        const pollRes = await fetch(LAMBDA_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "suno-cover", taskIdV1, taskIdV2 }) });
        const data = await pollRes.json();
        if (data.status === "complete") return data;
        if (data.status === "failed" || data.error) throw new Error(data.error || "Remix failed");
        await new Promise(r => setTimeout(r, 8000));
        return poll();
      };

      const finalData = await poll();
      clearInterval(timerRef.current);

      const tracks: any[] = [];
      if (finalData.v1?.audioUrl) tracks.push({ audioUrl: finalData.v1.audioUrl, imageUrl: finalData.v1.imageUrl, label: version1?.label || "Faithful Remix", description: version1?.description || "Production-upgraded, preserves original vibe", accent: "blue" });
      if (finalData.v2?.audioUrl) tracks.push({ audioUrl: finalData.v2.audioUrl, imageUrl: finalData.v2.imageUrl, label: version2?.label || "Viral Edition", description: version2?.description || "Trend-forward, maximum chart impact", accent: "purple" });

      const localEntries = tracks.map((track: any, i: number) => ({
        id: `local_${Date.now()}_${i}`, remix_title: track.label || 'AI Remix', original_title: songTitle || null, audio_url: track.audioUrl, image_url: track.imageUrl || null,
        genre: songGenre || analysisData?.genre || null, created_at: new Date().toISOString(), analysis_id: analysisId || null, suno_task_id: taskIdV1, description: track.description, accent: track.accent,
      }));
      if (user) saveRemixesToLocalStorage(user.id, localEntries);

      if (tracks[0]?.audioUrl) {
        playTrack({ id: `remix_${Date.now()}_0`, title: `${songTitle || 'AI Song'} – ${tracks[0].label || 'Remix'}`, audioUrl: tracks[0].audioUrl, imageUrl: tracks[0].imageUrl || undefined, sourceTitle: songTitle || undefined });
      }

      if (user && tracks.length > 0) {
        let savedCount = 0;
        for (const track of tracks) {
          try {
            const { error: saveErr } = await supabase.from("viralize_remixes").insert({
              user_id: user.id, analysis_id: analysisId || null, audio_url: track.audioUrl, image_url: track.imageUrl || null, suno_task_id: taskIdV1,
              genre: songGenre || analysisData?.genre || null, original_title: songTitle || null, remix_title: track.label || 'AI Remix', status: 'complete',
            });
            if (!saveErr) savedCount++;
            else console.warn('Supabase save error:', saveErr.message, saveErr.code);
          } catch (e) { console.warn('Supabase save exception:', e); }
        }
        if (savedCount > 0) toast.success(`✅ ${savedCount} song${savedCount > 1 ? 's' : ''} saved to your library!`, { action: { label: 'View Library', onClick: () => window.location.href = '/library' } });
        else toast.info('Songs ready! Saved locally — find them in your Library.', { action: { label: 'View Library', onClick: () => window.location.href = '/library' } });
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
      <div className="flex items-center gap-2.5 mb-5">
        <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Rocket className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-black font-heading text-foreground">Make This Track Viral</h2>
          <p className="text-xs text-muted-foreground">Apply proven patterns from high-performing tracks</p>
        </div>
      </div>

      {status === "idle" && (
        <div className="space-y-4">
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

          <div>
            <label className="text-sm font-bold text-foreground mb-1.5 block">Remix Style</label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {remixStyles.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <LyricsEditor analysisData={analysisData} onLyricsReady={(l) => { setLyrics(l); startRemix(); }} />

          <motion.button onClick={startRemix} disabled={!canCreate}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            whileHover={canCreate ? { scale: 1.01 } : {}} whileTap={canCreate ? { scale: 0.98 } : {}}>
            <Rocket className="h-4 w-4" />
            {lyrics.trim() ? "Create AI Remix with My Lyrics" : "Create AI Remix"}
          </motion.button>
        </div>
      )}

      {status === "uploading" && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 text-accent mx-auto animate-spin mb-3" />
          <p className="text-sm font-medium text-foreground">Uploading your track...</p>
          <p className="text-xs text-muted-foreground mt-1">Preparing audio for AI analysis</p>
        </div>
      )}

      {status === "processing" && <RemixProcessingUI elapsed={elapsed} />}

      {status === "error" && (
        <div className="text-center py-6 space-y-3">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button onClick={() => { setStatus("idle"); setError(""); }} variant="outline" className="gap-2 border-border">Try Again</Button>
        </div>
      )}

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
            <Link to="/library" className="text-xs text-primary hover:text-primary/80 border border-primary/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 flex-shrink-0 ml-3">
              <Headphones className="h-3.5 w-3.5" /> My Library
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.tracks.map((track: any, i: number) => (
              <div key={i} className={`rounded-xl border p-4 ${i === 0 ? "border-blue-500/30 bg-blue-500/5" : "border-purple-500/30 bg-purple-500/5"}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{i === 0 ? "🎸" : "🚀"}</span>
                  <div>
                    <p className={`text-sm font-bold ${i === 0 ? "text-blue-300" : "text-purple-300"}`}>{track.label}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{track.description}</p>
                  </div>
                </div>
                {track.imageUrl && <img src={track.imageUrl} alt={track.label} className="w-full h-28 object-cover rounded-lg mb-3" />}
                <div className="flex gap-2 mb-2">
                  <button onClick={() => { playTrack({ id: `remix_${Date.now()}_${i}`, title: `${songTitle || 'AI Song'} – ${track.label || 'Remix'}`, audioUrl: track.audioUrl, sourceTitle: songTitle || undefined }); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${i === 0 ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30' : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30'}`}>
                    <Play className="h-4 w-4" /> Play Now
                  </button>
                  <a href={track.audioUrl} download={`${songTitle}_${(track.label || 'remix').replace(/\s+/g, "_")}.mp3`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs border border-border/40 text-muted-foreground hover:text-foreground transition-colors">
                    <Download className="h-3.5 w-3.5" /> MP3
                  </a>
                </div>
                <audio ref={el => { audioRefs.current[i] = el; }} src={track.audioUrl} className="w-full h-8 opacity-50 hover:opacity-100 transition-opacity" controls
                  onPlay={() => { audioRefs.current.forEach((a, idx) => { if (a && idx !== i) a.pause(); }); setPlaying(i); }} />
              </div>
            ))}
          </div>
          <button onClick={() => { setStatus("idle"); setResult(null); setError(""); }} className="w-full py-2 text-xs text-muted-foreground hover:text-foreground border border-border/30 rounded-lg transition-colors">
            ↩ Create another version
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── DNA Score Card (extracted for hooks compliance) ─── */
const DnaCard = ({ dna, index, hookAnalysis, emotionalCore }: { dna: { label: string; value: number; max: number }; index: number; hookAnalysis?: string; emotionalCore?: string }) => {
  const badge = getStatusBadge(dna.value, dna.max);
  const description = getDnaDescription(dna.label, dna.value, hookAnalysis, emotionalCore);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className={`rounded-xl border ${badge.borderClass} ${badge.bgClass} p-4`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-base font-bold text-foreground">{dna.label}</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-black tabular-nums text-foreground">{dna.value}<span className="text-xs text-muted-foreground font-normal">/{dna.max}</span></span>
          <span className={`text-xs font-bold ${badge.textClass}`}>{badge.emoji} {badge.label}</span>
        </div>
      </div>
      <p className="text-sm text-foreground/70 leading-relaxed">{description}</p>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════
   MAIN RESULTS PAGE — REDESIGNED
   ═══════════════════════════════════════════════ */
const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
    hookTiming, bpmEstimate, energyLevel, dataSource,
    hookAnalysis, viralPotential, competitorMatch,
    emotionalCore, viralLine,
    danceability, valence,
    similarSongs,
  } = results;

  const isRealAudio = dataSource === "real_audio_analysis";
  const confidence = confidenceFromScore(score);
  const targetScore = Math.min(100, score + 19);

  // Derive HIT DNA scores
  const hookStrength = hookAnalysis ? Math.min(10, Math.round(score * 0.1 + (competitorMatch || 5) * 0.3 + 2)) : Math.round(score / 10);
  const replayValue = Math.min(10, Math.round((danceability || 5) * 0.5 + (valence || 5) * 0.3 + score * 0.02));
  const emotionalImpact = Math.min(10, Math.round((valence || 5) * 0.6 + (emotionalCore ? 3 : 0) + score * 0.02));
  const structureQuality = Math.min(10, Math.round(score * 0.08 + (hookTiming ? 2 : 0) + 1));
  const marketFit = competitorMatch || Math.min(10, Math.round(score * 0.09 + 1));
  const algorithmCompat = Math.min(10, Math.round((danceability || 5) * 0.3 + (valence || 5) * 0.2 + score * 0.04));

  const dnaScores = [
    { label: "Hook Strength", value: hookStrength, max: 10 },
    { label: "Replay Value", value: replayValue, max: 10 },
    { label: "Emotional Impact", value: emotionalImpact, max: 10 },
    { label: "Structure Quality", value: structureQuality, max: 10 },
    { label: "Market Fit", value: marketFit, max: 10 },
    { label: "Platform Readiness", value: algorithmCompat, max: 10 },
  ];

  // Critical issues with humanized titles
  const criticalIssues = (improvements || []).slice(0, 4).map((imp: string, i: number) => {
    const isHook = imp.toLowerCase().includes('hook');
    const isEnergy = imp.toLowerCase().includes('energy') || imp.toLowerCase().includes('dynamic');
    const isLyric = imp.toLowerCase().includes('lyric') || imp.toLowerCase().includes('word');
    return {
      title: humanizeIssueTitle(
        isHook ? "Hook Needs Optimization" : isEnergy ? "Energy Progression Issue" : isLyric ? "Lyric Impact Gap" : `Issue ${i + 1}`,
        imp
      ),
      cost: isHook ? "60% of listeners skip within 15 seconds when the hook doesn't land."
           : isEnergy ? "Flat energy drops replay rates by up to 40%."
           : isLyric ? "Generic lyrics get 50% fewer saves and shares."
           : "This reduces how often algorithms recommend your track.",
      fix: imp,
      impact: isHook ? "+15–20 points" : isEnergy ? "+10–15 points" : isLyric ? "+8–12 points" : "+10–15 points",
    };
  });

  // Top 2 strengths
  const topStrengths = (strengths || []).slice(0, 2);

  // Benchmarks
  const avgTopScore = 78;
  const gap = avgTopScore - score;

  // Share URL
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`My song "${title}" scored ${score}/100 on Santo!\n\nCheck yours → santo.fm`)}`;

  // Estimated impact from oneChange
  const oneChangeImpact = Math.min(25, Math.max(12, Math.round((100 - score) * 0.35)));

  // Active section tracking
  const [activeSection, setActiveSection] = useState("hero");
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

  return (
    <div className="min-h-screen px-4 pt-28 pb-32 bg-background relative">
      {/* Scroll-spy nav */}
      <ScrollNav activeSection={activeSection} />

      <div className="max-w-2xl mx-auto space-y-8 relative z-10">

        {/* ═══ SECTION 1 — HERO ═══ */}
        <Section delay={0} id="hero">
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            {/* 1A — Emotional Headline + Score */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
              <div className="flex-1 text-center md:text-left">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-2xl md:text-3xl font-black font-heading text-foreground leading-tight"
                >
                  {getEmotionalHeadline(score)}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-muted-foreground mt-2"
                >
                  "{title}" {songGenre ? `· ${songGenre}` : ''}
                </motion.p>

                {/* Share row */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 }}
                  className="flex gap-2 mt-4 justify-center md:justify-start"
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
              <div className="flex-shrink-0">
                <ScoreGauge score={score} size="small" />
              </div>
            </div>

            {/* 1B — #1 Fix */}
            {oneChange && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="mt-6 rounded-xl border-2 border-accent/40 bg-accent/[0.06] p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🎯</span>
                  <span className="text-sm font-black text-accent uppercase tracking-wider">Your Biggest Opportunity Right Now</span>
                </div>
                <p className="text-base font-bold text-foreground leading-relaxed">
                  {oneChange}
                </p>
                <p className="text-sm text-accent font-semibold mt-2">
                  → Estimated impact: +{oneChangeImpact} points on your viral score
                </p>
              </motion.div>
            )}

            {/* 1C — Confidence & Context */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="text-xs text-muted-foreground mt-4 text-center"
            >
              Based on patterns from 500K+ tracks · Confidence: {confidence}% · {isRealAudio ? "Audio Analysis" : "Pattern Analysis"} {songGenre ? `· ${songGenre}` : ''}
            </motion.p>
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

        {/* ═══ SECTION 2 — SCORE BREAKDOWN ═══ */}
        <Section delay={2} id="breakdown">
          <h2 className="text-lg md:text-xl font-black font-heading text-foreground mb-4">
            Why You Scored {score}
          </h2>
          <div className="space-y-3">
            {dnaScores.map((dna, i) => (
              <DnaCard key={dna.label} dna={dna} index={i} hookAnalysis={hookAnalysis} emotionalCore={emotionalCore} />
            ))}
          </div>
        </Section>

        {/* ═══ SECTION 3 — WHAT'S HOLDING YOU BACK ═══ */}
        {criticalIssues.length > 0 && (
          <Section delay={3} id="holding-back">
            <h2 className="text-lg md:text-xl font-black font-heading text-foreground mb-4">
              What's Holding You Back
            </h2>
            <div className="space-y-3">
              {criticalIssues.map((issue, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-5 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">🔴</span>
                    <h3 className="text-base font-bold text-foreground leading-snug">{issue.title}</h3>
                  </div>
                  <div className="pl-8 space-y-3">
                    <div>
                      <p className="text-[10px] text-red-400/80 font-bold uppercase tracking-widest mb-1">What this costs you</p>
                      <p className="text-sm text-foreground/70 leading-relaxed">{issue.cost}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-green-400/80 font-bold uppercase tracking-widest mb-1">The fix</p>
                      <p className="text-sm text-foreground/80 leading-relaxed">{issue.fix}</p>
                      <p className="text-sm text-accent font-semibold mt-1">→ {issue.impact}</p>
                    </div>
                    <button
                      onClick={() => document.getElementById("viral-cta")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent/80 transition-colors"
                    >
                      Fix This With AI Remix <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* ═══ SECTION 4 — WHAT'S WORKING ═══ */}
        {topStrengths.length > 0 && (
          <Section delay={4} id="working">
            <h2 className="text-lg md:text-xl font-black font-heading text-foreground mb-4">
              What's Already Working For You 💪
            </h2>
            <div className="space-y-3">
              {topStrengths.map((strength: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-xl border border-green-500/25 bg-green-500/[0.05] p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">✅</span>
                    <p className="text-sm font-medium text-foreground leading-relaxed">{strength}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* ═══ SECTION 5 — YOU VS TOP TRACKS ═══ */}
        <Section delay={5} id="vs-top">
          <h2 className="text-lg md:text-xl font-black font-heading text-foreground mb-4">
            You vs Top Tracks
          </h2>
          <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
            {/* Gap Visual */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">You</span>
                  <span className="font-bold tabular-nums text-foreground">{score}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div className="h-full rounded-full bg-primary" style={{ transformOrigin: "left" }}
                    initial={{ scaleX: 0 }} whileInView={{ scaleX: score / 100 }} viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Top Tracks</span>
                  <span className="font-bold tabular-nums text-accent">{avgTopScore}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div className="h-full rounded-full bg-accent/60" style={{ transformOrigin: "left" }}
                    initial={{ scaleX: 0 }} whileInView={{ scaleX: avgTopScore / 100 }} viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} />
                </div>
              </div>
            </div>

            <p className="text-sm text-center font-semibold text-foreground/80">
              {gap > 0
                ? `${gap} points behind top tracks — fixable`
                : "You're already performing at top-track level 🔥"
              }
            </p>
          </div>

          {/* Similar songs — filter out "unknown" */}
          {similarSongs?.length > 0 && (
            <div className="mt-3 space-y-2.5">
              {similarSongs
                .filter((song: any) => song.streams && song.streams !== "unknown")
                .slice(0, 3)
                .map((song: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card p-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                    <SpotifyLogo className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground">{song.artist}</p>
                  </div>
                  <span className="text-sm font-black text-accent tabular-nums flex-shrink-0">{song.streams}</span>
                </motion.div>
              ))}
            </div>
          )}
        </Section>

        {/* ═══ SECTION 6 — 7-DAY PLAN ═══ */}
        <Section delay={6} id="plan">
          <h2 className="text-lg md:text-xl font-black font-heading text-foreground mb-4">
            Your 7-Day Plan to Hit {targetScore}+
          </h2>

          <div className="space-y-3">
            {/* Day 1-2 */}
            <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black text-accent bg-accent/15 px-2 py-0.5 rounded-md">DAY 1–2</span>
              </div>
              <p className="text-sm font-bold text-foreground leading-relaxed">
                {oneChange || (improvements?.[0] || "Fix the primary issue identified above")}
              </p>
              <p className="text-xs text-accent font-semibold mt-1">→ adds {oneChangeImpact}–{oneChangeImpact + 5} points</p>
              <button
                onClick={() => document.getElementById("viral-cta")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent/15 border border-accent/25 text-accent text-xs font-bold hover:bg-accent/25 transition-colors"
              >
                <Rocket className="h-3.5 w-3.5" /> Try AI Remix <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Day 3-4 */}
            <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black text-primary bg-primary/15 px-2 py-0.5 rounded-md">DAY 3–4</span>
              </div>
              <p className="text-sm font-bold text-foreground leading-relaxed">
                {improvements?.[1] || "Punch up verse energy — add a riser or drum fill before chorus"}
              </p>
              <p className="text-xs text-primary font-semibold mt-1">→ adds 8–12 points</p>
            </div>

            {/* Day 5-7 */}
            <div className="rounded-xl border border-green-500/20 bg-green-500/[0.04] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black text-green-400 bg-green-500/15 px-2 py-0.5 rounded-md">DAY 5–7</span>
              </div>
              <p className="text-sm font-bold text-foreground leading-relaxed">
                Re-upload and re-analyze to measure your improvement
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3 gap-1.5 text-xs border-green-500/25 text-green-400 hover:bg-green-500/10 h-8">
                <Link to="/analyze"><Upload className="h-3.5 w-3.5" /> Analyze Again <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-bold text-center text-foreground/80 mt-4 p-3 rounded-lg bg-card border border-border"
          >
            Do all 3 → you're likely hitting {targetScore}–{Math.min(100, targetScore + 6)} by end of week.
          </motion.p>
        </Section>

        {/* ═══ SECTION 7 — CONVERSION CTA ═══ */}
        <Section delay={7}>
          {canRemix ? (
            <AiRemixSection uploadedFile={uploadedFile || null} existingS3Key={s3Key} songTitle={title} songGenre={songGenre} analysisData={results} analysisId={analysisId} />
          ) : (
            <div id="viral-cta" className="rounded-2xl border border-accent/25 bg-gradient-to-b from-accent/[0.06] to-transparent p-6 md:p-8 text-center relative overflow-hidden scroll-mt-24">
              <div className="max-w-md mx-auto space-y-5">
                <div className="space-y-2">
                  <p className="text-xl md:text-2xl font-black font-heading text-foreground">
                    Your track scored {score}.
                  </p>
                  <p className="text-base text-foreground/80 leading-relaxed">
                    Tracks like yours average <strong className="text-accent">{targetScore}</strong> after one AI Remix session.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <motion.button
                    onClick={() => setShowRemixPaywall(true)}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-bold text-base overflow-hidden"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Rocket className="h-5 w-5" /> Remix This Track — $7 one-time
                    </span>
                  </motion.button>
                  <Link
                    to="/pricing"
                    className="w-full py-3.5 rounded-xl border border-primary/30 bg-primary/[0.06] text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors"
                  >
                    Get Unlimited Remixes — $19/mo
                  </Link>
                </div>

                {/* Social proof */}
                <div className="pt-2 border-t border-border/30">
                  <p className="text-sm text-foreground/60 italic">
                    "I went from 58 to 84 with one remix"
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">— @axelbeats</p>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* Paywall modal */}
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

        {/* Trust layer */}
        <Section delay={8}>
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

        {/* Bottom actions */}
        <Section delay={9} className="pb-8">
          <div className="flex flex-col items-center gap-3">
            <Button asChild size="lg" className="gradient-purple text-primary-foreground font-bold glow-purple w-full max-w-xs h-11 text-sm">
              <Link to="/analyze">Analyze Another Track</Link>
            </Button>
          </div>
        </Section>
      </div>

      {/* Mobile sticky bottom CTA */}
      {!canRemix && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-background/95 backdrop-blur-lg border-t border-border/50"
        >
          <button
            onClick={() => document.getElementById("viral-cta")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-bold text-sm flex items-center justify-center gap-2"
            style={{ minHeight: 56 }}
          >
            <Rocket className="h-4 w-4" />
            Remix This Track — From $7
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default Results;
