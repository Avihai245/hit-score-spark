import { useLocation, Link, Navigate, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_LIMITS } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Check, X, Target, ListMusic, Lightbulb, Clock, Activity, Zap,
  Headphones, Music, User, AlertTriangle, KeyRound, MapPin,
  ArrowRight, Download, Share2, Play, Pause, Copy, Sparkles, Shield,
  BarChart3, TrendingUp, Radio, Mic2, FileText, Calendar, Award, Eye,
  ChevronRight
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════
   OFFICIAL PLATFORM LOGOS
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
    <path d="M16.8 8.4a3.3 3.3 0 01-2.4-1.6V6h-2.3v8.8a1.9 1.9 0 01-1.9 1.6 1.9 1.9 0 01-1.9-1.9 1.9 1.9 0 011.9-1.9c.2 0 .4 0 .5.1v-2.4c-.2 0-.3 0-.5 0a4.2 4.2 0 00-4.2 4.2 4.2 4.2 0 004.2 4.2 4.2 4.2 0 004.2-4.2V10a5.4 5.4 0 003.2 1V8.6a3.3 3.3 0 01-.8-.2z" fill="url(#ttGrad2)"/>
    <defs>
      <linearGradient id="ttGrad2" x1="8" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="#25F4EE" stopOpacity="0.4"/>
        <stop offset="1" stopColor="#FE2C55" stopOpacity="0.4"/>
      </linearGradient>
    </defs>
  </svg>
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

/* ─── Compact Score Ring ─── */
const ScoreGauge = ({ score }: { score: number }) => {
  const r = 72;
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
    <div className="relative flex items-center justify-center w-[172px] h-[172px]">
      <motion.div
        className="absolute inset-0 rounded-full blur-[50px] opacity-20"
        style={{ backgroundColor: color }}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1.3, opacity: 0.25 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
      />
      <svg width="172" height="172" className="-rotate-90">
        <circle cx="86" cy="86" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="7" opacity="0.4" />
        <motion.circle
          cx="86" cy="86" r={r} fill="none"
          stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2.2, ease: "easeOut" }}
        />
        <motion.circle
          cx="86" cy="86" r={r} fill="none"
          stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2.2, ease: "easeOut" }}
          opacity="0.12" filter="blur(5px)"
        />
      </svg>
      <div className="absolute text-center">
        <motion.div className="text-[44px] font-black tracking-tighter tabular-nums font-heading leading-none" style={{ color }}>
          {rounded}
        </motion.div>
        <div className="text-[9px] text-muted-foreground font-semibold mt-1 uppercase tracking-[0.2em]">out of 100</div>
      </div>
    </div>
  );
};

/* ─── Compact metric bar ─── */
const MetricBar = ({ label, value, max, color, sublabel }: { label: string; value: number; max: number; color: string; sublabel?: string }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{value}<span className="text-muted-foreground font-normal">/{max}</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      {sublabel && <p className="text-[10px] text-muted-foreground">{sublabel}</p>}
    </div>
  );
};

/* ─── Mini stat pill ─── */
const StatPill = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border">
    <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
    <div className="min-w-0">
      <div className="text-[8px] text-muted-foreground font-semibold uppercase tracking-[0.15em]">{label}</div>
      <div className="text-xs font-bold text-foreground truncate">{value}</div>
    </div>
  </div>
);

/* ─── Platform source row ─── */
const SourceRow = () => (
  <div className="flex items-center gap-2 py-2">
    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Verified by</span>
    <div className="flex items-center gap-1.5">
      <SpotifyLogo size={14} />
      <AppleMusicLogo size={14} />
      <TikTokLogo size={14} />
    </div>
  </div>
);

/* ─── Roadmap ─── */
const generateRoadmap = (score: number) => {
  if (score >= 80) {
    return [
      { week: "W1", action: "Release-ready. Set up distributor, pre-save link, artwork.", status: "ready" as const },
      { week: "W2", action: "Submit to Spotify editorial + 15 indie curators.", status: "ready" as const },
      { week: "W3", action: "Release: 3 TikTok clips with hook. DM 20 influencers.", status: "ready" as const },
      { week: "W4", action: "Run $50-100 ads. Round 2 curators. Analyze Spotify data.", status: "ready" as const },
    ];
  }
  if (score >= 60) {
    return [
      { week: "W1", action: "Apply recommended changes. Re-record flagged sections.", status: "warning" as const },
      { week: "W2", action: "Re-analyze. Target 80+ before release. Fine-tune hook.", status: "warning" as const },
      { week: "W3", action: "Score hits 80+: set up pre-save, begin curator outreach.", status: "ready" as const },
      { week: "W4", action: "Release and promote. Track data daily. Submit to playlists.", status: "ready" as const },
    ];
  }
  return [
    { week: "W1", action: "Focus on improvements. Re-write weakest sections.", status: "critical" as const },
    { week: "W2", action: "Re-record with improvements. Fix hook timing and energy.", status: "critical" as const },
    { week: "W3", action: "Re-analyze on Viralize. Iterate until 65+.", status: "warning" as const },
    { week: "W4", action: "Once ready, set up distribution and launch campaign.", status: "ready" as const },
  ];
};

const statusColors = { ready: "bg-green-500", warning: "bg-accent", critical: "bg-red-500" };

/* ─── Remix helpers ─── */
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
    const a = document.createElement("a");
    a.href = blobUrl; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(blobUrl);
  } catch { window.open(url, "_blank"); }
};

const ProcessingWaveform = () => (
  <div className="flex items-end justify-center gap-1 h-12">
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <motion.div key={i} className="w-1.5 rounded-full bg-gradient-to-t from-accent to-yellow-300"
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

/* ─── Lyrics Editor (compact) ─── */
const LyricsEditor = ({ analysisData, onLyricsReady }: { analysisData: any; onLyricsReady: (lyrics: string) => void }) => {
  const original = analysisData?.originalLyrics || "";
  const improved = analysisData?.improvedLyrics || "";
  const lyricFix = analysisData?.lyricFix || "";
  const viralLine = analysisData?.viralLine || "";
  const oneChange = analysisData?.oneChange || "";

  const [lyrics, setLyrics] = useState(original);
  const [applyImproved, setApplyImproved] = useState(false);
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
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground flex items-center gap-2">
            <Mic2 className="h-3.5 w-3.5 text-primary" /> Song Lyrics
          </label>
          {improved && (
            <button onClick={() => setApplyImproved(!applyImproved)}
              className={`text-[10px] px-2.5 py-1 rounded-md border transition-colors ${applyImproved ? "bg-primary/15 border-primary/30 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
              AI-improved
            </button>
          )}
        </div>
        <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)}
          placeholder="Paste your song lyrics here..."
          className="w-full h-32 bg-muted/40 border border-border rounded-lg p-3 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/40 transition-colors font-mono"
        />
      </div>
      {recommendations.length > 0 && (
        <div className="space-y-1.5">
          {recommendations.map(rec => (
            <div key={rec.id}
              className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-xs ${rec.applied ? "bg-primary/8 border-primary/20" : "bg-card border-border hover:border-muted-foreground/20"}`}
              onClick={() => setRecommendations(prev => prev.map(r => r.id === rec.id ? {...r, applied: !r.applied} : r))}>
              <div className={`mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors ${rec.applied ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                {rec.applied && <Check className="h-2 w-2 text-primary-foreground" />}
              </div>
              <p className="text-foreground/80 flex-1 leading-relaxed">{rec.text}</p>
            </div>
          ))}
        </div>
      )}
      <motion.button onClick={() => onLyricsReady(buildFinalLyrics())}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-accent to-yellow-400 text-black font-bold text-sm"
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <span className="flex items-center justify-center gap-2">
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
    <div>
      {status === "idle" && (
        <div className="flex flex-col items-center gap-3">
          {!file && (
            <input type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
              className="w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/15 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/25 cursor-pointer" />
          )}
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="h-9 border-border text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{remixStyles.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={() => setStatus("lyrics")} disabled={!file} className="w-full bg-gradient-to-r from-accent to-yellow-400 text-black font-bold h-10 gap-2 text-sm">
            <Sparkles className="h-4 w-4" /> Create AI Remix
          </Button>
        </div>
      )}
      {status === "lyrics" && <LyricsEditor analysisData={analysisData} onLyricsReady={(l) => { setFinalLyrics(l); startRemix(l); }} />}
      {(status === "uploading" || status === "processing") && (
        <div className="flex flex-col items-center gap-4 py-6">
          <ProcessingWaveform />
          <p className="text-sm font-semibold text-foreground">{remixMessages(elapsed)}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{elapsed}s</p>
        </div>
      )}
      {status === "error" && (
        <div className="text-center py-4">
          <p className="text-red-400 text-sm font-medium mb-3">{error}</p>
          <Button onClick={() => { setStatus("idle"); setError(""); }} variant="outline" size="sm">Try Again</Button>
        </div>
      )}
      {status === "complete" && tracks.length > 0 && (
        <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {tracks.map((track: any, idx: number) => (
            <div key={idx} className="rounded-lg bg-muted/30 border border-border p-3 flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 border border-border flex items-center justify-center overflow-hidden">
                {track.imageUrl ? <img src={track.imageUrl} alt="" className="w-full h-full object-cover" /> : <Music className="h-4 w-4 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{tracks.length > 1 ? `Version ${idx + 1}` : "AI Remix"}</p>
              </div>
              <button onClick={() => togglePlay(idx)} className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors">
                {playing === idx ? <Pause className="h-3.5 w-3.5 text-primary" /> : <Play className="h-3.5 w-3.5 text-primary ml-0.5" />}
              </button>
              <Button size="sm" variant="ghost" onClick={() => downloadTrack(track.url, `${songTitle || "remix"}-v${idx + 1}.mp3`)} className="h-9 w-9 p-0">
                <Download className="h-3.5 w-3.5" />
              </Button>
              <audio ref={el => { audioRefs.current[idx] = el; }} src={track.url} onEnded={() => setPlaying(null)} />
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => { setStatus("idle"); setResult(null); setElapsed(0); }} className="w-full gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Create Another
          </Button>
        </motion.div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN RESULTS PAGE — COMPACT DASHBOARD
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

  const badge = scoreBadge(score);
  const hasViralLine = viralLine && viralLine !== "none yet";
  const roadmap = generateRoadmap(score);

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`My song "${title}" scored ${score}/100 on Viralize!\nCheck yours → viralize.app`)}`;

  const profileStats = [
    { icon: Clock, label: "Hook", value: hookTiming },
    { icon: Activity, label: "BPM", value: bpmEstimate },
    { icon: KeyRound, label: "Key", value: musicalKey },
    { icon: Zap, label: "Energy", value: energyLevel },
  ].filter(s => s.value != null);

  /* ─── Viral % calc ─── */
  const viral = Math.min(100, Math.round(
    (score * 0.5) + ((danceability || 5) * 3) + ((valence || 5) * 2)
  ));

  return (
    <div className="min-h-screen px-3 sm:px-4 pt-20 pb-16 bg-background">
      <div className="container max-w-5xl space-y-4">

        {/* ═══ HERO — Score + Verdict + Stats ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-border bg-card p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {/* Score */}
            <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 flex-shrink-0">
              <ScoreGauge score={score} />
              <div className="sm:hidden flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground truncate mb-0.5">"{title}"</p>
                <h1 className="text-sm font-bold font-heading text-foreground leading-snug">{verdict}</h1>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.6 }}
                  className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[9px] font-bold border tracking-widest ${badge.cls}`}
                >
                  {badge.label}
                </motion.span>
              </div>
            </div>

            {/* Desktop info */}
            <div className="flex-1 min-w-0 hidden sm:block">
              <div className="flex items-center gap-3 mb-1">
                <p className="text-xs text-muted-foreground truncate">"{title}"</p>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.6 }}
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border tracking-widest ${badge.cls}`}
                >
                  {badge.label}
                </motion.span>
              </div>
              <h1 className="text-base md:text-lg font-bold font-heading text-foreground leading-snug mb-3">{verdict}</h1>
              
              {/* Stats inline */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {profileStats.map(stat => (
                  <StatPill key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} />
                ))}
              </div>
              
              {/* Viral bar */}
              <div className="flex items-center gap-3 rounded-lg bg-muted/30 border border-border px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-accent" />
                  <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">Viral</span>
                </div>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-accent to-yellow-300"
                    initial={{ width: 0 }} animate={{ width: `${viral}%` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  />
                </div>
                <span className="text-xs font-black text-accent tabular-nums">{viral}%</span>
                <div className="flex items-center gap-1 ml-1">
                  <SpotifyLogo size={11} /><AppleMusicLogo size={11} /><TikTokLogo size={11} />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: stats + viral below */}
          <div className="sm:hidden mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              {profileStats.map(stat => (
                <StatPill key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} />
              ))}
            </div>
            <div className="flex items-center gap-2.5 rounded-lg bg-muted/30 border border-border px-3 py-2">
              <TrendingUp className="h-3 w-3 text-accent" />
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-accent to-yellow-300"
                  initial={{ width: 0 }} animate={{ width: `${viral}%` }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                />
              </div>
              <span className="text-xs font-black text-accent tabular-nums">{viral}%</span>
              <SpotifyLogo size={10} /><AppleMusicLogo size={10} /><TikTokLogo size={10} />
            </div>
          </div>
        </motion.div>

        {/* ═══ ONE CHANGE — Prominent callout ═══ */}
        {oneChange && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border border-accent/20 bg-gradient-to-r from-accent/[0.06] to-transparent p-3.5 sm:p-4 flex items-start gap-3"
          >
            <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Target className="h-3.5 w-3.5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] text-accent font-bold uppercase tracking-[0.2em] mb-0.5">The One Change Before Releasing</p>
              <p className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed">{oneChange}</p>
            </div>
          </motion.div>
        )}

        {/* ═══ MAIN CONTENT — 2 Column Grid on Desktop ═══ */}
        <div className="grid gap-4 lg:grid-cols-5">

          {/* ─── LEFT COLUMN (3/5) — Analysis ─── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Honest Truth + Hook side by side */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid gap-3 sm:grid-cols-2">
              {viralPotential && (
                <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-3.5 w-3.5 text-primary" />
                    <h3 className="text-[10px] font-bold font-heading text-foreground uppercase tracking-wider">The Honest Truth</h3>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{viralPotential}</p>
                </div>
              )}
              {hookAnalysis && (
                <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-3.5 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    <h3 className="text-[10px] font-bold font-heading text-foreground uppercase tracking-wider">Hook Analysis</h3>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{hookAnalysis}</p>
                </div>
              )}
            </motion.div>

            {/* Algorithm Scores */}
            {(competitorMatch || valence != null || danceability != null) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="rounded-xl border border-border bg-card p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold font-heading text-foreground uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5 text-primary" /> Algorithm Scores
                  </h3>
                  <div className="flex items-center gap-1"><SpotifyLogo size={11} /><AppleMusicLogo size={11} /></div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {competitorMatch != null && <MetricBar label="Genre Match" value={competitorMatch} max={10} color="hsl(38 92% 50%)" />}
                  {valence != null && <MetricBar label="Valence" value={valence} max={10} color="hsl(142 71% 45%)" />}
                  {danceability != null && <MetricBar label="Danceability" value={danceability} max={10} color="hsl(258 90% 66%)" />}
                </div>
                {(saveRatePrediction || skipRiskMoment) && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {saveRatePrediction && (
                      <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5">
                        <p className="text-[8px] text-primary font-bold uppercase tracking-[0.15em] mb-0.5">Save Rate</p>
                        <p className="text-xs font-bold text-foreground">{saveRatePrediction}</p>
                      </div>
                    )}
                    {skipRiskMoment && (
                      <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-2.5">
                        <div className="flex items-center gap-1 mb-0.5">
                          <AlertTriangle className="h-3 w-3 text-red-400" />
                          <p className="text-[8px] text-red-400 font-bold uppercase tracking-[0.15em]">Skip Risk</p>
                        </div>
                        <p className="text-[11px] font-medium text-foreground/70">{skipRiskMoment}</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Lyric Intelligence */}
            {(lyricWeakness || lyricFix || hasViralLine) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="rounded-xl border border-border bg-card p-3.5 sm:p-4 space-y-2.5">
                <h3 className="text-[10px] font-bold font-heading text-foreground uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-primary" /> Lyric Intelligence
                </h3>
                {lyricWeakness && lyricFix && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-2.5">
                      <p className="text-[8px] text-red-400 font-bold uppercase tracking-[0.15em] mb-0.5">Weakness</p>
                      <p className="text-[11px] text-foreground/60 italic leading-relaxed">"{lyricWeakness}"</p>
                    </div>
                    <div className="rounded-lg bg-green-500/5 border border-green-500/10 p-2.5">
                      <p className="text-[8px] text-green-400 font-bold uppercase tracking-[0.15em] mb-0.5">Fix</p>
                      <p className="text-[11px] text-green-300/80 italic leading-relaxed">"{lyricFix}"</p>
                    </div>
                  </div>
                )}
                {hasViralLine && (
                  <div className="rounded-lg bg-accent/5 border border-accent/15 p-2.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Award className="h-3 w-3 text-accent" />
                      <p className="text-[8px] text-accent font-bold uppercase tracking-[0.15em]">Most Viral Line</p>
                    </div>
                    <p className="text-xs font-semibold text-foreground italic">"{viralLine}"</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Strengths / Improvements */}
            {(strengths?.length > 0 || improvements?.length > 0) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                className="grid gap-3 sm:grid-cols-2">
                {strengths?.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-5 w-5 rounded bg-green-500/10 flex items-center justify-center"><Check className="h-3 w-3 text-green-400" /></div>
                      <h3 className="text-[10px] font-bold font-heading text-foreground">What's Working</h3>
                    </div>
                    <div className="space-y-1.5">
                      {strengths.map((s: string, i: number) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <div className="mt-1.5 flex-shrink-0 h-1 w-1 rounded-full bg-green-400" />
                          <span className="text-[11px] text-foreground/75 leading-relaxed">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {improvements?.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-5 w-5 rounded bg-red-500/10 flex items-center justify-center"><X className="h-3 w-3 text-red-400" /></div>
                      <h3 className="text-[10px] font-bold font-heading text-foreground">What to Fix</h3>
                    </div>
                    <div className="space-y-1.5">
                      {improvements.map((s: string, i: number) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <div className="mt-1.5 flex-shrink-0 h-1 w-1 rounded-full bg-red-400" />
                          <span className="text-[11px] text-foreground/75 leading-relaxed">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* ─── RIGHT COLUMN (2/5) — Strategy + Remix ─── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Audience */}
            {(targetAudience || listeningMoment || tikTokFit) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="rounded-xl border border-border bg-card p-3.5 sm:p-4 space-y-2.5">
                <h3 className="text-[10px] font-bold font-heading text-foreground uppercase tracking-wider flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-primary" /> Audience
                </h3>
                {targetAudience && (
                  <div className="flex items-start gap-2">
                    <User className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-foreground/80 leading-relaxed">{targetAudience}</p>
                  </div>
                )}
                {listeningMoment && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-foreground/80 leading-relaxed">{listeningMoment}</p>
                  </div>
                )}
                {tikTokFit && (
                  <div className="flex items-start gap-2">
                    <TikTokLogo size={12} />
                    <p className="text-[11px] text-foreground/80 leading-relaxed">{tikTokFit}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Theme / Emotional */}
            {(songTheme || emotionalCore) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="rounded-xl border border-border bg-card p-3.5 sm:p-4 space-y-2">
                {songTheme && (
                  <div>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mb-0.5">Theme</p>
                    <p className="text-xs font-medium text-foreground">{songTheme}</p>
                  </div>
                )}
                {emotionalCore && (
                  <div>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mb-0.5">Emotional Core</p>
                    <p className="text-xs font-medium text-foreground">{emotionalCore}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Genre Comparison */}
            {similarSongs?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="rounded-xl border border-border bg-card p-3.5 sm:p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold font-heading text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Award className="h-3.5 w-3.5 text-primary" /> Genre Comparison
                  </h3>
                  <div className="flex items-center gap-1"><SpotifyLogo size={11} /><AppleMusicLogo size={11} /></div>
                </div>
                {similarSongs.slice(0, 3).map((song: any, i: number) => (
                  <div key={i} className="rounded-lg bg-muted/30 border border-border p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <SpotifyLogo size={14} />
                      <span className="font-semibold text-[11px] text-foreground truncate flex-1">{song.title}</span>
                      {song.streams && <span className="text-[10px] font-black text-accent tabular-nums">{song.streams}</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{song.artist}</p>
                    {song.whatTheyHaveThatYouDont && (
                      <p className="text-[10px] text-foreground/50 mt-1 leading-relaxed">{song.whatTheyHaveThatYouDont}</p>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {/* Playlist Targets */}
            {(playlistStrategy || matchedPlaylists?.length > 0) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                className="rounded-xl border border-border bg-card p-3.5 sm:p-4 space-y-2.5">
                <h3 className="text-[10px] font-bold font-heading text-foreground uppercase tracking-wider flex items-center gap-2">
                  <ListMusic className="h-3.5 w-3.5 text-primary" /> Playlist Targets
                  <SpotifyLogo size={11} />
                </h3>
                {playlistStrategy && (
                  <p className="text-[11px] text-foreground/80 leading-relaxed">{playlistStrategy}</p>
                )}
                {matchedPlaylists?.length > 0 && (
                  <div className="space-y-1.5">
                    {matchedPlaylists.slice(0, 4).map((pl: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border px-2.5 py-1.5">
                        <SpotifyLogo size={12} />
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-[11px] text-foreground truncate block">{pl.name}</span>
                          {pl.followers && <span className="text-[9px] text-muted-foreground">{pl.followers}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* 30-Day Roadmap */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="rounded-xl border border-border bg-card p-3.5 sm:p-4 space-y-2">
              <h3 className="text-[10px] font-bold font-heading text-foreground uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-primary" /> 30-Day Roadmap
              </h3>
              {roadmap.map((item) => (
                <div key={item.week} className="flex items-start gap-2 py-1">
                  <div className={`mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full ${statusColors[item.status]}`} />
                  <div>
                    <span className="text-[9px] font-bold text-primary uppercase tracking-wider">{item.week}</span>
                    <p className="text-[11px] text-foreground/75 leading-relaxed">{item.action}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ═══ AI REMIX — Full width, prominent ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="rounded-xl border border-accent/20 bg-gradient-to-r from-accent/[0.04] via-transparent to-primary/[0.03] p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center sm:min-w-[140px]">
              <Headphones className="h-7 w-7 text-accent flex-shrink-0" />
              <div>
                <h2 className="text-base sm:text-lg font-black font-heading text-foreground">AI Remix</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">Enhanced production with viral energy</p>
              </div>
            </div>
            <div className="flex-1">
              {canRemix ? (
                <AiRemixSection uploadedFile={uploadedFile || null} songTitle={title} songGenre={songGenre} analysisData={results} analysisId={analysisId} />
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <p className="text-xs text-muted-foreground">Score: <strong className="text-accent">{score}/100</strong></p>
                  <Button onClick={() => setShowRemixPaywall(true)} className="bg-gradient-to-r from-accent to-yellow-400 text-black font-bold gap-2 h-10">
                    <Sparkles className="h-4 w-4" /> Unlock AI Remix <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <p className="text-[10px] text-muted-foreground">Pro $19/mo or $7 one-time</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══ Bottom Actions ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2"
        >
          <Button asChild size="sm" className="h-9 text-xs gap-1.5 gradient-purple text-primary-foreground font-bold px-6">
            <Link to="/analyze">Analyze Another Song</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-9 text-xs gap-1.5">
            <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Share on X
            </a>
          </Button>
        </motion.div>

        {hasExhaustedFreeAnalysis && (
          <div className="rounded-xl border border-accent/20 bg-card text-center p-4">
            <Zap className="h-5 w-5 text-accent mx-auto mb-1.5" />
            <h3 className="text-xs font-bold text-foreground mb-1">Free analysis used</h3>
            <p className="text-[11px] text-muted-foreground mb-3">Upgrade for unlimited analyses + AI remixes</p>
            <div className="flex flex-col sm:flex-row justify-center gap-2">
              <Button asChild size="sm" className="bg-gradient-to-r from-accent to-yellow-400 text-black font-bold text-xs"><Link to="/billing">Upgrade to Pro — $19/mo</Link></Button>
              <Button asChild size="sm" variant="outline" className="text-xs"><Link to="/billing">Single Analysis — $3</Link></Button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showRemixPaywall && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowRemixPaywall(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="max-w-sm w-full rounded-xl border border-border bg-card p-6 text-center" onClick={e => e.stopPropagation()}>
                <Headphones className="h-7 w-7 text-primary mx-auto mb-3" />
                <h3 className="text-base font-bold text-foreground mb-1">AI Remix — Pro Feature</h3>
                <p className="text-xs text-muted-foreground mb-4">"{title}" scored <strong className="text-accent">{score}/100</strong></p>
                <div className="space-y-2">
                  <Button asChild className="w-full bg-gradient-to-r from-accent to-yellow-400 text-black font-bold"><Link to="/billing">Upgrade to Pro — $19/mo</Link></Button>
                  <Button asChild variant="outline" className="w-full"><Link to="/billing">Single Remix — $7</Link></Button>
                  <button onClick={() => setShowRemixPaywall(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 block mx-auto">Maybe later</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Results;
