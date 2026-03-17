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
  ArrowRight, Download, Share2, Play, Pause, Copy, Sparkles, Shield,
  BarChart3, TrendingUp, Radio, Mic2, FileText, Calendar, Award, Eye
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════
   OFFICIAL PLATFORM LOGOS — pixel-perfect SVG reproductions
   ═══════════════════════════════════════════════════════════ */

const SpotifyLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#1DB954" />
    <path d="M17.2 16.7a.7.7 0 01-.97.24c-2.66-1.63-6-2-9.94-1.1a.7.7 0 01-.31-1.37c4.3-.98 7.99-.56 10.97 1.27a.7.7 0 01.25.96zm1.17-2.93a.88.88 0 01-1.21.29c-3.05-1.87-7.69-2.42-11.3-1.32a.88.88 0 01-.5-1.69c4.12-1.25 9.24-.64 12.72 1.51a.88.88 0 01.29 1.21zm.1-3.05c-3.65-2.17-9.69-2.37-13.18-1.31a1.06 1.06 0 01-.61-2.03c4-1.22 10.65-.98 14.86 1.52a1.06 1.06 0 01-1.07 1.82z" fill="white"/>
  </svg>
);

const AppleMusicLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="amGrad" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FA233B" />
        <stop offset="1" stopColor="#FB5C74" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="5.4" fill="url(#amGrad)" />
    <path d="M17.5 6.2v8.6c0 .5-.1 1-.4 1.4-.3.4-.6.7-1.1.9-.3.1-.7.2-1.1.3-.4.1-.7.1-1 .1-.6 0-1.1-.2-1.5-.5-.4-.3-.6-.8-.6-1.3 0-.4.1-.7.3-1 .2-.3.5-.5.8-.7.4-.2.8-.3 1.2-.4.4-.1.8-.1 1.2-.2V9.6L10.5 10.8v6c0 .5-.1 1-.4 1.4-.3.4-.7.7-1.1.9-.3.1-.7.2-1 .3-.4.1-.7.1-1 .1-.6 0-1.1-.2-1.5-.5-.4-.4-.6-.8-.6-1.4 0-.4.1-.7.3-1 .2-.3.5-.5.8-.7.4-.2.8-.3 1.2-.4.4-.1.8-.1 1.2-.2V7.5c0-.3.1-.6.2-.8.2-.2.4-.4.7-.5l5.7-1.6c.1 0 .3-.1.4-.1h.3c.3 0 .5.1.6.3.2.2.2.4.2.7V6.2z" fill="white"/>
  </svg>
);

const TikTokLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="5.4" fill="#000" />
    <path d="M16.8 8.4a3.3 3.3 0 01-2.4-1.6V6h-2.3v8.8a1.9 1.9 0 01-1.9 1.6 1.9 1.9 0 01-1.9-1.9 1.9 1.9 0 011.9-1.9c.2 0 .4 0 .5.1v-2.4c-.2 0-.3 0-.5 0a4.2 4.2 0 00-4.2 4.2 4.2 4.2 0 004.2 4.2 4.2 4.2 0 004.2-4.2V10a5.4 5.4 0 003.2 1V8.6a3.3 3.3 0 01-.8-.2z" fill="white"/>
    <path d="M16.8 8.4a3.3 3.3 0 01-2.4-1.6V6h-2.3v8.8a1.9 1.9 0 01-1.9 1.6 1.9 1.9 0 01-1.9-1.9 1.9 1.9 0 011.9-1.9c.2 0 .4 0 .5.1v-2.4c-.2 0-.3 0-.5 0a4.2 4.2 0 00-4.2 4.2 4.2 4.2 0 004.2 4.2 4.2 4.2 0 004.2-4.2V10a5.4 5.4 0 003.2 1V8.6a3.3 3.3 0 01-.8-.2z" fill="url(#ttGrad)"/>
    <defs>
      <linearGradient id="ttGrad" x1="8" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="#25F4EE" stopOpacity="0.4"/>
        <stop offset="1" stopColor="#FE2C55" stopOpacity="0.4"/>
      </linearGradient>
    </defs>
  </svg>
);

/* ─── Verified Data Chip ─── */
const DataChip = ({ platform, label }: { platform: "spotify" | "apple" | "ai" | "tiktok"; label?: string }) => {
  const logos: Record<string, ReactNode> = {
    spotify: <SpotifyLogo size={14} />,
    apple: <AppleMusicLogo size={14} />,
    tiktok: <TikTokLogo size={14} />,
    ai: <Shield className="h-3.5 w-3.5 text-primary" />,
  };
  const labels: Record<string, string> = {
    spotify: "Spotify",
    apple: "Apple Music",
    tiktok: "TikTok",
    ai: "AI Analysis",
  };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card border border-border text-[10px] font-semibold tracking-wide text-muted-foreground uppercase select-none">
      {logos[platform]}
      <span>{label || labels[platform]}</span>
    </span>
  );
};

const DataChips = ({ platforms }: { platforms: ("spotify" | "apple" | "ai" | "tiktok")[] }) => (
  <div className="flex flex-wrap gap-1.5 mb-5">
    {platforms.map(p => <DataChip key={p} platform={p} />)}
  </div>
);

/* ─── Score helpers ─── */
const scoreColor = (s: number) => {
  if (s < 40) return "hsl(0 84% 60%)";
  if (s < 65) return "hsl(38 92% 50%)";
  if (s < 80) return "hsl(142 71% 45%)";
  return "hsl(258 90% 66%)";
};

const scoreBadge = (s: number) => {
  if (s < 40) return { label: "NEEDS WORK", cls: "bg-red-500/10 text-red-400 border-red-500/20" };
  if (s < 65) return { label: "PROMISING", cls: "bg-accent/10 text-accent border-accent/20" };
  if (s < 80) return { label: "STRONG POTENTIAL", cls: "bg-green-500/10 text-green-400 border-green-500/20" };
  return { label: "HIT POTENTIAL", cls: "bg-primary/10 text-primary border-primary/20" };
};

/* ─── Premium Score Ring ─── */
const ScoreGauge = ({ score }: { score: number }) => {
  const r = 88;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const ctrl = animate(count, score, { duration: 2.2, ease: "easeOut" });
    return ctrl.stop;
  }, [count, score]);

  return (
    <div className="relative flex items-center justify-center w-[220px] h-[220px] mx-auto">
      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-[60px] opacity-20"
        style={{ backgroundColor: color }}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 0.2 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
      />
      {/* Track ring */}
      <svg width="220" height="220" className="-rotate-90">
        <circle cx="110" cy="110" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" opacity="0.5" />
        <motion.circle
          cx="110" cy="110" r={r} fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2.2, ease: "easeOut" }}
        />
        {/* Glow layer */}
        <motion.circle
          cx="110" cy="110" r={r} fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2.2, ease: "easeOut" }}
          opacity="0.15"
          filter="blur(6px)"
        />
      </svg>
      {/* Number */}
      <div className="absolute text-center">
        <motion.div className="text-[56px] font-black tracking-tighter tabular-nums font-heading leading-none" style={{ color }}>
          {rounded}
        </motion.div>
        <div className="text-[10px] text-muted-foreground font-semibold mt-1.5 uppercase tracking-[0.25em]">out of 100</div>
      </div>
    </div>
  );
};

/* ─── Viral Potential ─── */
const ViralMeter = ({ score, danceability, valence }: { score: number; danceability?: number; valence?: number }) => {
  const viral = Math.min(100, Math.round(
    (score * 0.5) + ((danceability || 5) * 3) + ((valence || 5) * 2)
  ));

  return (
    <div className="rounded-xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-accent" />
          <div>
            <p className="text-sm font-bold text-foreground">Viral Potential</p>
            <p className="text-[10px] text-muted-foreground">Algorithmic virality score across platforms</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-accent tabular-nums">{viral}%</span>
        </div>
      </div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent to-yellow-300"
          initial={{ width: 0 }}
          animate={{ width: `${viral}%` }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[9px] text-muted-foreground uppercase tracking-widest font-medium">
        <span>Low</span>
        <span>Moderate</span>
        <span>High</span>
        <span>Viral</span>
      </div>
      <div className="flex items-center gap-1.5 mt-4">
        <SpotifyLogo size={12} />
        <AppleMusicLogo size={12} />
        <TikTokLogo size={12} />
        <span className="text-[9px] text-muted-foreground ml-1">Cross-platform analysis</span>
      </div>
    </div>
  );
};

/* ─── Animated metric bar ─── */
const MetricBar = ({ label, value, max, color, sublabel }: { label: string; value: number; max: number; color: string; sublabel?: string }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}<span className="text-muted-foreground font-normal">/{max}</span></span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      {sublabel && <p className="text-[11px] text-muted-foreground">{sublabel}</p>}
    </div>
  );
};

/* ─── Section wrapper ─── */
const Section = ({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-30px" }}
    transition={{ delay: delay * 0.25, duration: 0.45, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.section>
);

/* ─── Section header with icon ─── */
const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="h-8 w-8 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center flex-shrink-0">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div>
      <h2 className="text-base font-bold font-heading text-foreground tracking-wide">{title}</h2>
      {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
    </div>
  </div>
);

/* ─── Card wrapper ─── */
const ReportCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-border bg-card p-5 md:p-6 ${className}`}>
    {children}
  </div>
);

/* ─── Roadmap ─── */
const generateRoadmap = (score: number) => {
  if (score >= 80) {
    return [
      { week: "Week 1", action: "Your song is release-ready. Set up distributor, create pre-save link, and prepare artwork.", status: "ready" as const },
      { week: "Week 2", action: "Submit to Spotify editorial playlists. Pitch 15+ independent curators in your genre.", status: "ready" as const },
      { week: "Week 3", action: "Release day: post 3 TikTok clips using the hook. Send to your email list. DM 20 influencers.", status: "ready" as const },
      { week: "Week 4", action: "Run $50-100 in targeted ads. Submit to Round 2 curators. Analyze Spotify for Artists data.", status: "ready" as const },
    ];
  }
  if (score >= 60) {
    return [
      { week: "Week 1", action: "Apply the recommended change above. Re-record or remix the flagged sections.", status: "warning" as const },
      { week: "Week 2", action: "Re-analyze on Viralize. Target 80+ before release. Fine-tune the hook.", status: "warning" as const },
      { week: "Week 3", action: "Once score hits 80+, set up pre-save and begin curator outreach.", status: "ready" as const },
      { week: "Week 4", action: "Release and promote. Track data daily. Submit to playlists listed below.", status: "ready" as const },
    ];
  }
  return [
    { week: "Week 1", action: "Focus on the improvements listed above. Consider re-writing the weakest sections.", status: "critical" as const },
    { week: "Week 2", action: "Re-record with improvements. Pay attention to hook timing and energy levels.", status: "critical" as const },
    { week: "Week 3", action: "Re-analyze on Viralize. Iterate until you hit 65+.", status: "warning" as const },
    { week: "Week 4", action: "Once ready, set up distribution and begin your release campaign.", status: "ready" as const },
  ];
};

const statusColors = { ready: "bg-green-500", warning: "bg-accent", critical: "bg-red-500" };

/* ─── Remix styles ─── */
const remixStyles = [
  { value: "same", label: "Same vibe (enhanced)" },
  { value: "energetic", label: "More energetic" },
  { value: "emotional", label: "More emotional" },
  { value: "danceable", label: "More danceable" },
  { value: "radio", label: "Radio pop crossover" },
];

/* ─── Download helper ─── */
const downloadTrack = async (url: string, filename: string) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
};

/* ─── Processing Waveform ─── */
const ProcessingWaveform = () => (
  <div className="flex items-end justify-center gap-1 h-14">
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <motion.div
        key={i}
        className="w-1.5 rounded-full bg-gradient-to-t from-accent to-yellow-300"
        animate={{ scaleY: [0.2, 1, 0.2] }}
        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1, ease: "easeInOut" }}
        style={{ height: "100%", transformOrigin: "bottom" }}
      />
    ))}
  </div>
);

const remixMessages = (elapsed: number) => {
  if (elapsed < 10) return "Uploading your song...";
  if (elapsed < 30) return "AI is reading your melody...";
  if (elapsed < 90) return "Generating your enhanced version...";
  return "Finalizing the mix...";
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
  const [recommendations, setRecommendations] = useState<{id: string; text: string; applied: boolean}[]>([]);

  useEffect(() => {
    const recs: {id: string; text: string; applied: boolean}[] = [];
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
    const appliedRecs = recommendations.filter(r => r.applied).map(r => r.text).join(". ");
    return lyrics + (appliedRecs ? `\n\n[Notes for AI: ${appliedRecs}]` : "");
  };

  return (
    <div className="space-y-5">
      <ReportCard>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-foreground flex items-center gap-2">
              <Mic2 className="h-4 w-4 text-primary" /> Song Lyrics
            </label>
            {improved && (
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowDiff(!showDiff); if (!showDiff) setApplyImproved(false); }} className="text-[11px] px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors">
                  {showDiff ? "Hide comparison" : "Compare"}
                </button>
                <button
                  onClick={() => { setApplyImproved(!applyImproved); setShowDiff(false); }}
                  className={`text-[11px] px-3 py-1.5 rounded-md border transition-colors ${applyImproved ? "bg-primary/15 border-primary/30 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  AI-improved
                </button>
              </div>
            )}
          </div>
          {showDiff && improved ? (
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest block mb-1.5">Original</span>
                <div className="h-44 overflow-auto rounded-lg bg-red-500/5 border border-red-500/10 p-3 text-sm text-foreground/60 whitespace-pre-wrap font-mono">{original}</div>
              </div>
              <div>
                <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest block mb-1.5">AI Improved</span>
                <div className="h-44 overflow-auto rounded-lg bg-green-500/5 border border-green-500/10 p-3 text-sm text-green-300/80 whitespace-pre-wrap font-mono">{improved}</div>
              </div>
            </div>
          ) : (
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Paste your song lyrics here..."
              className="w-full h-44 bg-muted/40 border border-border rounded-lg p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/40 transition-colors font-mono"
            />
          )}
        </div>
      </ReportCard>

      {recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-accent" /> AI Recommendations
          </p>
          {recommendations.map(rec => (
            <div
              key={rec.id}
              className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${rec.applied ? "bg-primary/8 border-primary/20" : "bg-card border-border hover:border-muted-foreground/20"}`}
              onClick={() => setRecommendations(prev => prev.map(r => r.id === rec.id ? {...r, applied: !r.applied} : r))}
            >
              <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${rec.applied ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                {rec.applied && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
              </div>
              <p className="text-sm text-foreground/80 flex-1 leading-relaxed">{rec.text}</p>
            </div>
          ))}
        </div>
      )}

      <motion.button
        onClick={() => onLyricsReady(buildFinalLyrics())}
        className="relative w-full py-3.5 rounded-lg bg-gradient-to-r from-accent to-yellow-400 text-black font-bold text-sm overflow-hidden"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <span className="relative flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4" /> Create AI Remix <ArrowRight className="h-4 w-4" />
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
    else {
      audioRefs.current.forEach((a, i) => { if (a && i !== idx) a.pause(); });
      audio.play(); setPlaying(idx);
    }
  }, [playing]);

  const startRemix = async (customLyrics?: string) => {
    if (!file) return;
    setStatus("uploading"); setError(""); setElapsed(0);
    try {
      const base = import.meta.env.VITE_LAMBDA_URL || "https://u2yjblp3w5.execute-api.eu-west-1.amazonaws.com/prod/analyze";
      const urlRes = await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get-upload-url", fileName: file.name }) });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, s3Key } = await urlRes.json();
      await fetch(uploadUrl, { method: "PUT", body: file });
      setStatus("processing");
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
      const coverRes = await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "suno-cover", s3Key, title: songTitle, genre: songGenre, style, analysisData: { ...(analysisData || {}), customLyrics: customLyrics || finalLyrics } }) });
      if (!coverRes.ok) throw new Error("Failed to start remix");
      const coverData = await coverRes.json();
      if (!coverData.taskId) throw new Error(coverData.error || "Failed");
      const { taskId } = coverData;
      const poll = async () => {
        try {
          const res = await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "suno-cover", taskId }) });
          const data = await res.json();
          if (data.status === "complete") {
            clearInterval(timerRef.current); setResult(data); setStatus("complete");
            if (user) {
              const tracks = data.tracks || (data.audioUrl ? [{ audioUrl: data.audioUrl, imageUrl: data.imageUrl }] : []);
              const ft = tracks[0];
              const aUrl = ft?.url || ft?.audioUrl || data.audioUrl || "";
              const iUrl = ft?.image_url || ft?.imageUrl || data.imageUrl || "";
              if (aUrl) supabase.from("viralize_remixes").insert({ user_id: user.id, title: songTitle || "AI Remix", audio_url: aUrl, image_url: iUrl || null, style, genre: songGenre || null, suno_task_id: taskId, analysis_id: analysisId || null }).then(({ error: e }) => { if (e) console.warn(e); });
            }
          } else if (data.status === "failed") { clearInterval(timerRef.current); setError(data.message || "Failed"); setStatus("error"); }
          else setTimeout(poll, 3000);
        } catch { clearInterval(timerRef.current); setError("Connection lost."); setStatus("error"); }
      };
      setTimeout(poll, 8000);
    } catch (err: any) { clearInterval(timerRef.current); setError(err?.message || "Error"); setStatus("error"); }
  };

  useEffect(() => () => { clearInterval(timerRef.current); }, []);
  const tracks = (result?.tracks || (result?.audioUrl ? [{ audioUrl: result.audioUrl, imageUrl: result.imageUrl, title: "AI Remix" }] : [])).map((t: any) => ({ ...t, url: t.url || t.audioUrl }));

  return (
    <ReportCard className="border-accent/20 bg-gradient-to-b from-accent/[0.04] to-transparent">
      <div className="text-center mb-6">
        <Headphones className="h-8 w-8 text-accent mx-auto mb-3" />
        <h2 className="text-xl md:text-2xl font-black font-heading text-foreground">AI Remix</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">Enhanced production with stronger hooks and viral energy</p>
      </div>

      {status === "idle" && (
        <div className="flex flex-col items-center gap-4">
          {!file && (
            <div className="w-full max-w-sm">
              <input type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/25 cursor-pointer" />
            </div>
          )}
          <div className="w-full max-w-xs">
            <Select value={style} onValueChange={setStyle}><SelectTrigger className="h-10 border-border"><SelectValue /></SelectTrigger><SelectContent>{remixStyles.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
          </div>
          <Button onClick={() => setStatus("lyrics")} disabled={!file} className="bg-gradient-to-r from-accent to-yellow-400 text-black font-bold px-8 h-11 gap-2">
            <Sparkles className="h-4 w-4" /> Create AI Remix <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {status === "lyrics" && <LyricsEditor analysisData={analysisData} onLyricsReady={(l) => { setFinalLyrics(l); startRemix(l); }} />}

      {(status === "uploading" || status === "processing") && (
        <div className="flex flex-col items-center gap-5 py-6">
          <ProcessingWaveform />
          <p className="text-base font-semibold text-foreground">{remixMessages(elapsed)}</p>
          <p className="text-sm text-muted-foreground tabular-nums">{elapsed}s</p>
        </div>
      )}

      {status === "error" && (
        <div className="text-center py-4">
          <p className="text-red-400 font-medium mb-3">{error}</p>
          <Button onClick={() => { setStatus("idle"); setError(""); }} variant="outline" size="sm">Try Again</Button>
        </div>
      )}

      {status === "complete" && tracks.length > 0 && (
        <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {(result?.imageUrl || result?.coverArt) && (
            <div className="flex justify-center"><img src={result.imageUrl || result.coverArt} alt="Cover" className="w-36 h-36 rounded-xl object-cover border border-border" /></div>
          )}
          {tracks.map((track: any, idx: number) => (
            <div key={idx} className="rounded-lg bg-muted/30 border border-border p-4 flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 border border-border flex items-center justify-center">
                {track.imageUrl ? <img src={track.imageUrl} alt="" className="w-full h-full rounded-lg object-cover" /> : <Music className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{tracks.length > 1 ? `Version ${idx + 1}` : "AI Remix"}</p>
                {track.title && <p className="text-xs text-muted-foreground truncate">{track.title}</p>}
              </div>
              <button onClick={() => togglePlay(idx)} className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors">
                {playing === idx ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary ml-0.5" />}
              </button>
              <audio ref={el => { audioRefs.current[idx] = el; }} src={track.url} onEnded={() => setPlaying(null)} />
            </div>
          ))}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {tracks.map((track: any, idx: number) => (
              <Button key={idx} size="sm" variant="outline" onClick={() => downloadTrack(track.url, `${songTitle || "remix"}-v${idx + 1}.mp3`)} className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" /> Download {tracks.length > 1 ? `V${idx + 1}` : ""}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => { setStatus("idle"); setResult(null); setElapsed(0); }} className="gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5" /> Again
            </Button>
          </div>
        </motion.div>
      )}
    </ReportCard>
  );
};

/* ─── Paywall Banner ─── */
const PaywallBanner = ({ score }: { score: number }) => (
  <ReportCard className="border-accent/20 text-center">
    <Zap className="h-7 w-7 text-accent mx-auto mb-3" />
    <h3 className="text-lg font-bold text-foreground mb-1">Free analysis used</h3>
    <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">Upgrade to Pro for unlimited analyses + AI remixes. Score: <strong className="text-foreground">{score}/100</strong></p>
    <div className="flex flex-col sm:flex-row justify-center gap-2">
      <Button asChild className="bg-gradient-to-r from-accent to-yellow-400 text-black font-bold"><Link to="/billing">Upgrade to Pro — $19/mo</Link></Button>
      <Button asChild variant="outline"><Link to="/billing">Single Analysis — $3</Link></Button>
    </div>
  </ReportCard>
);

/* ─── Remix Paywall ─── */
const RemixPaywallModal = ({ score, songTitle, onClose }: { score: number; songTitle: string; onClose: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="max-w-sm w-full rounded-xl border border-border bg-card p-7 text-center" onClick={e => e.stopPropagation()}>
      <Headphones className="h-8 w-8 text-primary mx-auto mb-3" />
      <h3 className="text-xl font-bold text-foreground mb-1">AI Remix — Pro Feature</h3>
      <p className="text-sm text-muted-foreground mb-5">"{songTitle}" scored <strong className="text-accent">{score}/100</strong>. Create an enhanced remix.</p>
      <div className="space-y-2">
        <Button asChild className="w-full bg-gradient-to-r from-accent to-yellow-400 text-black font-bold"><Link to="/billing" onClick={onClose}>Upgrade to Pro — $19/mo</Link></Button>
        <Button asChild variant="outline" className="w-full"><Link to="/billing" onClick={onClose}>Single Remix — $7</Link></Button>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 block mx-auto">Maybe later</button>
      </div>
    </motion.div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN RESULTS PAGE
   ═══════════════════════════════════════════════════════════ */
const Results = () => {
  const location = useLocation();
  const _navigate = useNavigate();
  const state = location.state as { results: any; title: string; goal?: string; uploadedFile?: File; songGenre?: string; analysisId?: string } | null;

  if (!state?.results) return <Navigate to="/analyze" replace />;

  const { user, profile } = useAuth();
  const [showRemixPaywall, setShowRemixPaywall] = useState(false);
  const plan = (profile?.plan ?? "free") as keyof typeof PLAN_LIMITS;
  const analysesUsed = profile?.analyses_used ?? 0;
  const analysesLimit = PLAN_LIMITS[plan].analyses;
  const hasExhaustedFreeAnalysis = plan === "free" && analysesUsed >= analysesLimit;
  const canRemix = plan !== "free" || profile?.is_admin === true;

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

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`My song "${title}" scored ${score}/100 on Viralize!\nCheck yours → viralize.app`)}`;

  const profileStats = [
    { icon: Clock, label: "Hook", value: hookTiming },
    { icon: Activity, label: "BPM", value: bpmEstimate },
    { icon: KeyRound, label: "Key", value: musicalKey },
    { icon: Zap, label: "Energy", value: energyLevel },
    { icon: Mic2, label: "Opening", value: openingLyrics },
  ].filter(s => s.value != null);

  const themeFields = [
    { label: "Theme", value: songTheme },
    { label: "Emotional Core", value: emotionalCore },
  ].filter(f => f.value);

  return (
    <div className="min-h-screen px-4 pt-24 pb-20 bg-background">
      <div className="container max-w-3xl space-y-10">

        {/* ═══ SCORE HERO ═══ */}
        <Section delay={0} className="text-center">
          <div className="mb-6">
            <ScoreGauge score={score} />
          </div>

          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
            className={`inline-block px-4 py-1.5 rounded-full text-[11px] font-bold border tracking-widest ${badge.cls}`}
          >
            {badge.label}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-2xl md:text-[28px] font-bold font-heading text-foreground leading-snug mt-5 max-w-2xl mx-auto"
          >
            {verdict}
          </motion.h1>

          <p className="text-base text-muted-foreground mt-2">"{title}"</p>

          {isRealAudio && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold border border-green-500/20 bg-green-500/8 text-green-400 mt-3"
            >
              <Headphones className="h-3 w-3" /> Real Audio Analysis
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="flex flex-wrap items-center justify-center gap-1.5 mt-4"
          >
            <DataChip platform="spotify" />
            <DataChip platform="apple" />
            <DataChip platform="ai" />
          </motion.div>
        </Section>

        {/* ═══ SHARE ═══ */}
        <Section delay={0.05} className="flex justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full gap-2 px-6 h-10 text-sm font-semibold border-border">
                <Share2 className="h-4 w-4" /> Share Score Card
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border text-foreground p-0 overflow-hidden rounded-xl">
              <DialogHeader className="p-5 pb-0">
                <DialogTitle className="text-base font-bold">Share Your Score</DialogTitle>
              </DialogHeader>
              <div className="p-5 space-y-4">
                <div id="share-score-card" className="relative rounded-xl overflow-hidden bg-background p-5 border border-border">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary" />
                  <div className="absolute top-3 right-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">viralize.app</div>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <svg width="72" height="72" className="-rotate-90">
                        <circle cx="36" cy="36" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
                        <circle cx="36" cy="36" r="28" fill="none" stroke={scoreColor(score)} strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 28} strokeDashoffset={2 * Math.PI * 28 - (score / 100) * 2 * Math.PI * 28} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-black text-foreground">{score}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-bold text-sm truncate">{title}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${badge.cls}`}>{badge.label}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {bpmEstimate && <div className="text-center rounded-md bg-muted py-1.5"><p className="text-[9px] text-muted-foreground uppercase">BPM</p><p className="text-xs font-bold text-foreground">{bpmEstimate}</p></div>}
                    {hookTiming && <div className="text-center rounded-md bg-muted py-1.5"><p className="text-[9px] text-muted-foreground uppercase">Hook</p><p className="text-xs font-bold text-foreground">{hookTiming}</p></div>}
                    <div className="text-center rounded-md bg-muted py-1.5"><p className="text-[9px] text-muted-foreground uppercase">Viral</p><p className="text-xs font-bold text-accent">{Math.min(100, Math.round((score * 0.5) + ((danceability || 5) * 3) + ((valence || 5) * 2)))}%</p></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" className="gap-1 text-[11px]" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/results?shared=true&score=${score}&title=${encodeURIComponent(title)}`); toast.success("Copied!"); }}>
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 text-[11px]" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`My song scored ${score}/100 on Viralize. Check yours at viralize.app`)}`, "_blank")}>
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> Post
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 text-[11px]" onClick={async () => {
                    try {
                      const el = document.getElementById("share-score-card"); if (!el) return;
                      const { default: html2canvas } = await import("html2canvas");
                      const canvas = await html2canvas(el, { backgroundColor: "#0a0a0a", scale: 2 });
                      const link = document.createElement("a"); link.download = `viralize-${score}.png`; link.href = canvas.toDataURL(); link.click();
                    } catch { toast.error("Failed"); }
                  }}>
                    <Download className="h-3 w-3" /> Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </Section>

        {/* ═══ VIRAL POTENTIAL ═══ */}
        <Section delay={0.1}>
          <ViralMeter score={score} danceability={danceability} valence={valence} />
        </Section>

        {/* ═══ PAYWALL ═══ */}
        {user && hasExhaustedFreeAnalysis && <Section delay={0.12}><PaywallBanner score={score} /></Section>}

        {/* ═══ SONG PROFILE ═══ */}
        {(themeFields.length > 0 || profileStats.length > 0) && (
          <Section delay={0.15}>
            <SectionHeader icon={Radio} title="Song Profile" subtitle="Audio fingerprint and core characteristics" />
            <DataChips platforms={["ai", "spotify"]} />
            <ReportCard>
              {themeFields.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 mb-5">
                  {themeFields.map(f => (
                    <div key={f.label} className="rounded-lg bg-muted/40 p-3.5">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">{f.label}</span>
                      <p className="text-sm text-foreground mt-1 font-medium leading-relaxed">{f.value}</p>
                    </div>
                  ))}
                </div>
              )}
              {profileStats.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {profileStats.map(stat => (
                    <div key={stat.label} className="rounded-lg bg-muted/40 border border-border p-3 text-center">
                      <stat.icon className="h-3.5 w-3.5 mx-auto text-primary mb-1.5" />
                      <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-[0.15em]">{stat.label}</div>
                      <div className="text-sm font-bold text-foreground mt-0.5 truncate">{stat.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </ReportCard>
          </Section>
        )}

        {/* ═══ THE HONEST TRUTH ═══ */}
        {viralPotential && (
          <Section delay={0.2}>
            <SectionHeader icon={Eye} title="The Honest Truth" subtitle="Unbiased AI assessment" />
            <ReportCard className="border-l-4 border-l-primary">
              <p className="text-sm text-foreground/90 leading-relaxed">{viralPotential}</p>
            </ReportCard>
          </Section>
        )}

        {/* ═══ LYRIC INTELLIGENCE ═══ */}
        {(lyricWeakness || lyricFix || hasViralLine) && (
          <Section delay={0.25}>
            <SectionHeader icon={FileText} title="Lyric Intelligence" subtitle="AI lyric analysis" />
            <ReportCard className="space-y-5">
              {lyricWeakness && lyricFix && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-4">
                    <p className="text-[9px] text-red-400 font-bold uppercase tracking-[0.15em] mb-2">Current Weakness</p>
                    <p className="text-sm text-foreground/60 italic leading-relaxed">"{lyricWeakness}"</p>
                  </div>
                  <div className="rounded-lg bg-green-500/5 border border-green-500/10 p-4">
                    <p className="text-[9px] text-green-400 font-bold uppercase tracking-[0.15em] mb-2">Suggested Fix</p>
                    <p className="text-sm text-green-300/80 italic leading-relaxed">"{lyricFix}"</p>
                  </div>
                </div>
              )}
              {hasViralLine && (
                <div className="rounded-lg bg-accent/5 border border-accent/15 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-accent" />
                    <p className="text-[9px] text-accent font-bold uppercase tracking-[0.15em]">Most Viral Line</p>
                  </div>
                  <p className="text-base font-semibold text-foreground italic">"{viralLine}"</p>
                </div>
              )}
            </ReportCard>
          </Section>
        )}

        {/* ═══ ALGORITHM SCORES ═══ */}
        {(hookAnalysis || competitorMatch || valence != null || danceability != null) && (
          <Section delay={0.3}>
            <SectionHeader icon={BarChart3} title="Algorithm Scores" subtitle="Streaming platform ranking signals" />
            <DataChips platforms={["spotify", "apple", "ai"]} />
            <ReportCard className="space-y-5">
              {hookAnalysis && (
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    <p className="text-[9px] text-primary font-bold uppercase tracking-[0.15em]">Hook Analysis</p>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{hookAnalysis}</p>
                </div>
              )}
              {competitorMatch && <MetricBar label="Genre Competitor Match" value={competitorMatch} max={10} color="hsl(38 92% 50%)" sublabel="vs. current top tracks in your genre" />}
              {valence != null && <MetricBar label="Valence (Sad — Happy)" value={valence} max={10} color="hsl(142 71% 45%)" />}
              {danceability != null && <MetricBar label="Danceability" value={danceability} max={10} color="hsl(258 90% 66%)" />}
              {(saveRatePrediction || skipRiskMoment) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {saveRatePrediction && (
                    <div className="rounded-lg bg-primary/5 border border-primary/10 p-3.5">
                      <p className="text-[9px] text-primary font-bold uppercase tracking-[0.15em] mb-1">Save Rate</p>
                      <p className="text-base font-bold text-foreground">{saveRatePrediction}</p>
                    </div>
                  )}
                  {skipRiskMoment && (
                    <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                        <p className="text-[9px] text-red-400 font-bold uppercase tracking-[0.15em]">Skip Risk</p>
                      </div>
                      <p className="text-sm font-medium text-foreground/70">{skipRiskMoment}</p>
                    </div>
                  )}
                </div>
              )}
            </ReportCard>
          </Section>
        )}

        {/* ═══ AUDIENCE PROFILE ═══ */}
        {(targetAudience || listeningMoment || tikTokFit) && (
          <Section delay={0.35}>
            <SectionHeader icon={User} title="Audience Profile" subtitle="Target listeners and discovery channels" />
            <div className="grid gap-3 sm:grid-cols-3">
              {targetAudience && (
                <ReportCard>
                  <User className="h-4 w-4 text-primary mb-2" />
                  <p className="text-[9px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mb-1">Who They Are</p>
                  <p className="text-sm text-foreground leading-relaxed">{targetAudience}</p>
                </ReportCard>
              )}
              {listeningMoment && (
                <ReportCard>
                  <MapPin className="h-4 w-4 text-primary mb-2" />
                  <p className="text-[9px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mb-1">When They Listen</p>
                  <p className="text-sm text-foreground leading-relaxed">{listeningMoment}</p>
                </ReportCard>
              )}
              {tikTokFit && (
                <ReportCard>
                  <TikTokLogo size={16} />
                  <p className="text-[9px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mb-1 mt-2">TikTok Fit</p>
                  <p className="text-sm text-foreground leading-relaxed">{tikTokFit}</p>
                </ReportCard>
              )}
            </div>
          </Section>
        )}

        {/* ═══ GENRE COMPARISON ═══ */}
        {similarSongs?.length > 0 && (
          <Section delay={0.4}>
            <SectionHeader icon={Award} title="Genre Comparison" subtitle="Your song vs. trending tracks" />
            <DataChips platforms={["spotify", "apple"]} />
            <div className="grid gap-3 md:grid-cols-3">
              {similarSongs.slice(0, 3).map((song: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08 }}>
                  <ReportCard className="h-full hover:border-accent/25 transition-colors">
                    <div className="flex items-center gap-2.5 mb-3">
                      <SpotifyLogo size={20} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{song.title}</p>
                        <p className="text-xs text-muted-foreground">{song.artist}</p>
                      </div>
                    </div>
                    {song.streams && <p className="text-lg font-black text-accent tabular-nums mb-2">{song.streams}</p>}
                    {song.whatTheyHaveThatYouDont && (
                      <div className="pt-2.5 border-t border-border">
                        <p className="text-[9px] text-accent/60 font-bold uppercase tracking-[0.15em] mb-1">What they have</p>
                        <p className="text-[13px] text-foreground/60 leading-relaxed">{song.whatTheyHaveThatYouDont}</p>
                      </div>
                    )}
                  </ReportCard>
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* ═══ STRENGTHS / IMPROVEMENTS ═══ */}
        {(strengths?.length > 0 || improvements?.length > 0) && (
          <Section delay={0.5}>
            <div className="grid gap-4 md:grid-cols-2">
              {strengths?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded bg-green-500/10 flex items-center justify-center"><Check className="h-3.5 w-3.5 text-green-400" /></div>
                    <h2 className="text-sm font-bold font-heading text-foreground">What's Working</h2>
                  </div>
                  <ReportCard className="space-y-2.5">
                    {strengths.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="mt-1 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-green-400" />
                        <span className="text-sm text-foreground/75 leading-relaxed">{s}</span>
                      </div>
                    ))}
                  </ReportCard>
                </div>
              )}
              {improvements?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded bg-red-500/10 flex items-center justify-center"><X className="h-3.5 w-3.5 text-red-400" /></div>
                    <h2 className="text-sm font-bold font-heading text-foreground">What to Fix</h2>
                  </div>
                  <ReportCard className="space-y-2.5">
                    {improvements.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="mt-1 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-red-400" />
                        <span className="text-sm text-foreground/75 leading-relaxed">{s}</span>
                      </div>
                    ))}
                  </ReportCard>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ═══ THE ONE CHANGE ═══ */}
        {oneChange && (
          <Section delay={0.6}>
            <ReportCard className="border-accent/20 text-center py-8">
              <Target className="h-7 w-7 text-accent mx-auto mb-4" />
              <p className="text-[9px] text-accent font-bold uppercase tracking-[0.2em] mb-3">The One Change Before Releasing</p>
              <p className="text-lg md:text-xl font-bold text-foreground leading-snug max-w-xl mx-auto">{oneChange}</p>
              <p className="text-xs text-muted-foreground mt-4">This could be the difference between 1K and 1M streams.</p>
            </ReportCard>
          </Section>
        )}

        {/* ═══ PLAYLIST TARGETS ═══ */}
        {(playlistStrategy || matchedPlaylists?.length > 0) && (
          <Section delay={0.65}>
            <SectionHeader icon={ListMusic} title="Playlist Targets" subtitle="Curated playlists matching your sound" />
            <DataChips platforms={["spotify"]} />
            {playlistStrategy && (
              <ReportCard className="mb-4">
                <div className="flex items-start gap-2.5">
                  <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/80 leading-relaxed">{playlistStrategy}</p>
                </div>
              </ReportCard>
            )}
            {matchedPlaylists?.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {matchedPlaylists.slice(0, 6).map((pl: any, i: number) => (
                  <ReportCard key={i} className="py-3.5 px-4">
                    <div className="flex items-center gap-2 mb-1">
                      <SpotifyLogo size={14} />
                      <span className="font-semibold text-sm text-foreground truncate">{pl.name}</span>
                    </div>
                    {pl.followers && <p className="text-[11px] text-muted-foreground">{pl.followers} followers</p>}
                    {pl.reason && <p className="text-[11px] text-primary/60 mt-0.5">{pl.reason}</p>}
                  </ReportCard>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ═══ 30-DAY ROADMAP ═══ */}
        <Section delay={0.75}>
          <SectionHeader icon={Calendar} title="30-Day Release Roadmap" subtitle="Your step-by-step launch plan" />
          <div className="space-y-2">
            {roadmap.map((item, i) => (
              <motion.div key={item.week} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.06 }}>
                <ReportCard className="flex items-start gap-3.5 py-4">
                  <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${statusColors[item.status]}`} />
                  <div>
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">{item.week}</span>
                    <p className="text-sm text-foreground/75 mt-0.5 leading-relaxed">{item.action}</p>
                  </div>
                </ReportCard>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ═══ AI REMIX ═══ */}
        <Section delay={0.85}>
          {canRemix ? (
            <AiRemixSection uploadedFile={uploadedFile || null} songTitle={title} songGenre={songGenre} analysisData={results} analysisId={analysisId} />
          ) : (
            <ReportCard className="border-accent/20 text-center py-8">
              <Headphones className="h-8 w-8 text-accent mx-auto mb-3" />
              <h2 className="text-xl font-bold font-heading text-foreground mb-1">AI Remix</h2>
              <p className="text-sm text-muted-foreground mb-2 max-w-sm mx-auto">Enhance your song with AI production. Score: <strong className="text-accent">{score}/100</strong></p>
              <Button onClick={() => setShowRemixPaywall(true)} className="bg-gradient-to-r from-accent to-yellow-400 text-black font-bold gap-2 mt-4">
                <Sparkles className="h-4 w-4" /> Unlock AI Remix <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-[11px] text-muted-foreground mt-3">Pro $19/mo or $7 one-time</p>
            </ReportCard>
          )}
        </Section>

        <AnimatePresence>
          {showRemixPaywall && <RemixPaywallModal score={score} songTitle={title} onClose={() => setShowRemixPaywall(false)} />}
        </AnimatePresence>

        {/* ═══ BOTTOM CTA ═══ */}
        <Section delay={0.9} className="pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="gradient-purple text-primary-foreground font-bold px-8 h-12 text-sm">
              <Link to="/analyze">Analyze Another Song</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-6 h-12 text-sm font-semibold gap-2">
              <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Share on X
              </a>
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-3">
            <Link to="/billing" className="text-accent hover:underline font-medium inline-flex items-center gap-1">
              Upgrade to Pro for unlimited analyses <ArrowRight className="h-3 w-3" />
            </Link>
          </p>
        </Section>
      </div>
    </div>
  );
};

export default Results;
