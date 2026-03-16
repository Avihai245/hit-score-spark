import { useLocation, Link, Navigate, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_LIMITS } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Check, X, Target, ListMusic, Lightbulb, Clock, Activity, Zap,
  Headphones, Music, User, AlertTriangle, KeyRound, MapPin, Smartphone,
  ArrowRight, ChevronRight, Download, Share2, Upload, Play, Pause, Loader2, Copy, Sparkles
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { toast } from "sonner";

/* ─── Score color helper ─── */
const scoreColor = (s: number) => {
  if (s < 40) return "hsl(0 84% 60%)";
  if (s < 65) return "hsl(25 95% 53%)";
  if (s < 80) return "hsl(142 71% 45%)";
  return "hsl(270 91% 65%)";
};

const scoreGradient = (s: number) => {
  if (s < 40) return "from-red-500 to-red-600";
  if (s < 65) return "from-orange-400 to-orange-600";
  if (s < 80) return "from-green-400 to-green-600";
  return "from-purple-400 via-primary to-fuchsia-500";
};

const scoreBadge = (s: number) => {
  if (s < 40) return { label: "NEEDS WORK", cls: "bg-red-500/15 text-red-400 border-red-500/30" };
  if (s < 65) return { label: "PROMISING", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" };
  if (s < 80) return { label: "STRONG", cls: "bg-green-500/15 text-green-400 border-green-500/30" };
  return { label: "HIT POTENTIAL 🔥", cls: "bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-purple-300 border-purple-500/40" };
};

/* ─── Animated Score Gauge ─── */
const ScoreGauge = ({ score }: { score: number }) => {
  const r = 110;
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
    <div className="relative flex items-center justify-center">
      {/* Outer glow */}
      <motion.div
        className="absolute w-72 h-72 rounded-full blur-[80px] opacity-40"
        style={{ backgroundColor: color }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.4 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />
      {/* Particle ring */}
      {score >= 80 && (
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full border border-purple-500/20"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        >
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <motion.div
              key={deg}
              className="absolute w-2 h-2 rounded-full bg-purple-400"
              style={{
                top: '50%', left: '50%',
                transform: `rotate(${deg}deg) translateX(150px) translateY(-50%)`,
              }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 2, delay: deg / 360 }}
            />
          ))}
        </motion.div>
      )}
      <svg width="280" height="280" className="-rotate-90">
        <circle cx="140" cy="140" r={r} fill="none" stroke="hsl(0 0% 8%)" strokeWidth="16" />
        <motion.circle
          cx="140" cy="140" r={r} fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="16"
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
        <motion.div className="text-7xl font-black tracking-tight tabular-nums" style={{ color }}>
          {rounded}
        </motion.div>
        <div className="text-sm text-muted-foreground font-medium mt-1">/ 100</div>
      </div>
    </div>
  );
};

/* ─── Viral Potential Meter ─── */
const ViralMeter = ({ score, danceability, valence }: { score: number; danceability?: number; valence?: number }) => {
  const viral = Math.min(100, Math.round(
    (score * 0.5) + ((danceability || 5) * 3) + ((valence || 5) * 2)
  ));

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Viral Potential</span>
        </div>
        <span className="text-2xl font-black text-accent">{viral}%</span>
      </div>
      <div className="relative h-4 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent/80 via-accent to-yellow-300"
          initial={{ width: 0 }}
          animate={{ width: `${viral}%` }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
        />
        {/* Spark particles */}
        <motion.div
          className="absolute top-0 h-full w-1 bg-white/80 blur-[2px]"
          initial={{ left: 0 }}
          animate={{ left: `${viral}%` }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>Low</span>
        <span>Moderate</span>
        <span>🔥 Viral</span>
      </div>
    </div>
  );
};

/* ─── Animated bar ─── */
const AnimatedBar = ({ label, value, max, color, sublabel }: { label: string; value: number; max: number; color: string; sublabel?: string }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{value}/{max}</span>
      </div>
      <div className="h-3 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
      {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
};

/* ─── Section ─── */
const Section = ({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) => (
  <motion.section
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ delay: delay * 0.3, duration: 0.6 }}
    className={className}
  >
    {children}
  </motion.section>
);

const SectionTitle = ({ emoji, title }: { emoji: string; title: string }) => (
  <h2 className="flex items-center gap-3 text-xl font-bold font-heading mb-5">
    <span className="text-2xl">{emoji}</span> {title}
  </h2>
);

/* ─── Roadmap generator ─── */
const generateRoadmap = (score: number) => {
  if (score >= 80) {
    return [
      { week: "Week 1", action: "Your song is release-ready. Set up distributor, create pre-save link, and prepare artwork.", status: "🟢" },
      { week: "Week 2", action: "Submit to Spotify editorial playlists. Pitch 15+ independent curators in your genre.", status: "🟢" },
      { week: "Week 3", action: "Release day: post 3 TikTok clips using the hook. Send to your email list. DM 20 influencers.", status: "🟢" },
      { week: "Week 4", action: "Run $50-100 in targeted ads. Submit to Round 2 curators. Analyze Spotify for Artists data.", status: "🟢" },
    ];
  }
  if (score >= 60) {
    return [
      { week: "Week 1", action: "Apply the ONE CHANGE suggested above. Re-record or remix the flagged sections.", status: "🟡" },
      { week: "Week 2", action: "Re-analyze on Viralize. Target 80+ before release. Fine-tune the hook.", status: "🟡" },
      { week: "Week 3", action: "Once score hits 80+, set up pre-save and begin curator outreach.", status: "🟢" },
      { week: "Week 4", action: "Release and promote. Track data daily. Submit to playlists listed below.", status: "🟢" },
    ];
  }
  return [
    { week: "Week 1", action: "Focus on the improvements listed above. Consider re-writing the weakest sections.", status: "🔴" },
    { week: "Week 2", action: "Re-record with improvements. Pay attention to hook timing and energy levels.", status: "🔴" },
    { week: "Week 3", action: "Re-analyze on Viralize. Iterate until you hit 65+. Don't release below that.", status: "🟡" },
    { week: "Week 4", action: "Once ready, set up distribution and begin your release campaign.", status: "🟢" },
  ];
};

/* ═══════════════════════════════════════ */
/* ─── Remix styles ─── */
const remixStyles = [
  { value: "same", label: "Same vibe (enhanced)" },
  { value: "energetic", label: "More energetic" },
  { value: "emotional", label: "More emotional" },
  { value: "danceable", label: "More danceable" },
  { value: "radio", label: "Radio pop crossover" },
];

/* ─── Download helper ─── */
const downloadTrack = async (url: string, filename: string, asWav = false) => {
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

/* ─── Waveform Background ─── */
const WaveformBg = ({ bars = 50, className = "" }: { bars?: number; className?: string }) => (
  <div className={`absolute inset-0 flex items-end justify-center gap-[2px] opacity-[0.06] pointer-events-none overflow-hidden ${className}`}>
    {Array.from({ length: bars }).map((_, i) => (
      <div
        key={i}
        className="w-[3px] rounded-full bg-primary"
        style={{ height: `${15 + Math.random() * 70}%` }}
      />
    ))}
  </div>
);

/* ─── Remix Processing Waveform ─── */
const ProcessingWaveform = () => (
  <div className="flex items-end justify-center gap-1.5 h-16">
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <motion.div
        key={i}
        className="w-2 rounded-full bg-gradient-to-t from-accent to-yellow-300"
        animate={{ scaleY: [0.2, 1, 0.2] }}
        transition={{
          repeat: Infinity,
          duration: 0.8,
          delay: i * 0.12,
          ease: "easeInOut",
        }}
        style={{ height: "100%", transformOrigin: "bottom" }}
      />
    ))}
  </div>
);

const remixMessages = (elapsed: number) => {
  if (elapsed < 10) return "Uploading your song...";
  if (elapsed < 30) return "Suno AI is reading your melody...";
  if (elapsed < 90) return "Generating your enhanced version...";
  return "Finalizing the mix...";
};

/* ─── Lyrics Editor with Recommendations ─── */
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
    <div className="space-y-6">
      {/* Lyrics card with waveform bg */}
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <WaveformBg bars={60} />
        <div className="relative p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" />
              Song Lyrics
            </label>
            {improved && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowDiff(!showDiff); if (!showDiff) setApplyImproved(false); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                >
                  {showDiff ? "Hide comparison" : "Compare versions"}
                </button>
                <button
                  onClick={() => { setApplyImproved(!applyImproved); setShowDiff(false); }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                    applyImproved
                      ? "bg-primary/20 border-primary/40 text-primary"
                      : "border-white/20 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${applyImproved ? "bg-primary" : "bg-white/20"}`}>
                    <motion.div
                      className="absolute top-0.5 w-3 h-3 rounded-full bg-white"
                      animate={{ left: applyImproved ? 16 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                  AI-improved
                </button>
              </div>
            )}
          </div>

          {/* Side by side diff */}
          {showDiff && improved ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs text-red-400 font-bold uppercase tracking-wider">Original</span>
                <div className="h-48 overflow-auto rounded-xl bg-red-500/5 border border-red-500/10 p-3 text-sm text-white/70 whitespace-pre-wrap font-mono">
                  {original}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs text-green-400 font-bold uppercase tracking-wider">AI Improved</span>
                <div className="h-48 overflow-auto rounded-xl bg-green-500/5 border border-green-500/10 p-3 text-sm text-green-300/80 whitespace-pre-wrap font-mono">
                  {improved}
                </div>
              </div>
            </div>
          ) : (
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder={original ? "Your song lyrics..." : "Paste your song lyrics here for best results..."}
              className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 transition-colors font-mono"
            />
          )}
        </div>
      </div>

      {/* Recommendations as toggles */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-white flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent" />
            AI Recommendations
          </p>
          {recommendations.map(rec => (
            <motion.div
              key={rec.id}
              layout
              className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                rec.applied
                  ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5"
                  : "bg-white/[0.02] border-white/10 hover:border-white/20"
              }`}
              onClick={() => setRecommendations(prev => prev.map(r => r.id === rec.id ? {...r, applied: !r.applied} : r))}
            >
              <div className={`mt-0.5 flex-shrink-0 w-10 h-5 rounded-full relative transition-colors ${rec.applied ? "bg-primary" : "bg-white/15"}`}>
                <motion.div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md"
                  animate={{ left: rec.applied ? 20 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
              <p className="text-sm text-white/80 flex-1">{rec.text}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Big gold CTA */}
      <motion.button
        onClick={() => onLyricsReady(buildFinalLyrics())}
        className="relative w-full py-5 rounded-2xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-black text-lg overflow-hidden group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
        <span className="relative flex items-center justify-center gap-3">
          <Sparkles className="h-6 w-6" />
          Create AI Remix with These Lyrics
          <ArrowRight className="h-5 w-5" />
        </span>
      </motion.button>
    </div>
  );
};

const AiRemixSection = ({ uploadedFile, songTitle, songGenre, analysisData }: { uploadedFile: File | null; songTitle: string; songGenre?: string; analysisData?: any }) => {
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
    setStatus("uploading");
    setError("");
    setElapsed(0);

    try {
      const urlRes = await fetch((import.meta.env.VITE_LAMBDA_URL || "https://u2yjblp3w5.execute-api.eu-west-1.amazonaws.com/prod/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-upload-url", fileName: file.name }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, s3Key } = await urlRes.json();
      await fetch(uploadUrl, { method: "PUT", body: file });

      setStatus("processing");
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);

      const coverRes = await fetch((import.meta.env.VITE_LAMBDA_URL || "https://u2yjblp3w5.execute-api.eu-west-1.amazonaws.com/prod/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'suno-cover', s3Key, title: songTitle, genre: songGenre, style, analysisData: { ...(analysisData || {}), customLyrics: customLyrics || finalLyrics } }),
      });
      if (!coverRes.ok) throw new Error("Failed to start remix");
      const coverData = await coverRes.json();
      if (!coverData.taskId) throw new Error(coverData.error || "Failed to start remix");
      const { taskId } = coverData;

      const poll = async () => {
        try {
          const res = await fetch((import.meta.env.VITE_LAMBDA_URL || "https://u2yjblp3w5.execute-api.eu-west-1.amazonaws.com/prod/analyze"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: 'suno-cover', taskId }),
          });
          const data = await res.json();
          if (data.status === "complete") {
            clearInterval(timerRef.current);
            setResult(data);
            setStatus("complete");
            // Save remix to Supabase if logged in
            if (user) {
              const tracks = data.tracks || (data.audioUrl ? [{ audioUrl: data.audioUrl }] : []);
              const firstTrack = tracks[0];
              const audioUrl = firstTrack?.url || firstTrack?.audioUrl || data.audioUrl || '';
              if (audioUrl) {
                supabase.from('viralize_remixes').insert({
                  user_id: user.id,
                  title: songTitle || 'AI Remix',
                  audio_url: audioUrl,
                  style,
                }).then(({ error: e }) => { if (e) console.warn('Failed to save remix:', e); });
              }
            }
          } else if (data.status === "failed") {
            clearInterval(timerRef.current);
            setError(data.message || "Remix failed. Try again.");
            setStatus("error");
          } else {
            setTimeout(poll, 3000);
          }
        } catch {
          clearInterval(timerRef.current);
          setError("Connection lost. Try again.");
          setStatus("error");
        }
      };
      setTimeout(poll, 8000);
    } catch (err: any) {
      clearInterval(timerRef.current);
      setError(err?.message || "Something went wrong.");
      setStatus("error");
    }
  };

  useEffect(() => () => { clearInterval(timerRef.current); }, []);

  const tracks = (result?.tracks || (result?.audioUrl ? [{ audioUrl: result.audioUrl, imageUrl: result.imageUrl, title: "AI Remix" }] : [])).map((t: any) => ({ ...t, url: t.url || t.audioUrl }));

  return (
    <div className="rounded-2xl border-2 border-accent/40 bg-gradient-to-b from-accent/[0.08] to-transparent p-8 md:p-10 space-y-6 relative overflow-hidden">
      <WaveformBg bars={80} className="opacity-[0.04]" />
      <div className="relative text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-black font-heading text-white">🎧 AI Remix — Make It Go Viral</h2>
        <p className="text-sm text-muted-foreground">AI covers your song with the same vibe but stronger hook and viral energy</p>
      </div>

      {status === "idle" && (
        <div className="relative flex flex-col items-center gap-5">
          {!file && (
            <div className="w-full max-w-sm">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Upload your song file</label>
              <input
                type="file"
                accept=".mp3,.wav,audio/mpeg,audio/wav"
                onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/30 cursor-pointer"
              />
            </div>
          )}
          <div className="w-full max-w-xs">
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="h-11 border-accent/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {remixStyles.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <motion.button
            onClick={() => setStatus("lyrics")}
            disabled={!file}
            className="relative px-12 py-5 rounded-2xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-black text-lg disabled:opacity-40 overflow-hidden"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
            />
            <span className="relative flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Create AI Remix →
            </span>
          </motion.button>
          <p className="text-xs text-muted-foreground">Review lyrics → Create enhanced remix</p>
        </div>
      )}

      {status === "lyrics" && (
        <div className="relative">
          <LyricsEditor
            analysisData={analysisData}
            onLyricsReady={(lyrics) => {
              setFinalLyrics(lyrics);
              startRemix(lyrics);
            }}
          />
        </div>
      )}

      {(status === "uploading" || status === "processing") && (
        <div className="relative flex flex-col items-center gap-6 py-8">
          <ProcessingWaveform />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{remixMessages(elapsed)}</p>
            <p className="text-sm text-muted-foreground tabular-nums mt-2">{elapsed}s</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="relative flex flex-col items-center gap-4 py-4">
          <p className="text-red-400 font-medium">{error}</p>
          <Button onClick={() => { setStatus("idle"); setError(""); }} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
            Try Again
          </Button>
        </div>
      )}

      {status === "complete" && tracks.length > 0 && (
        <motion.div
          className="relative space-y-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Cover art */}
          {(result?.imageUrl || result?.coverArt) && (
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <img src={result.imageUrl || result.coverArt} alt="Remix cover" className="w-48 h-48 rounded-2xl object-cover border-2 border-accent/30 shadow-2xl shadow-accent/20" />
            </motion.div>
          )}
          {/* Track cards */}
          {tracks.map((track: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.15 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center gap-4"
            >
              {/* Album art placeholder */}
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 flex items-center justify-center">
                {track.imageUrl ? (
                  <img src={track.imageUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <Music className="h-7 w-7 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-white truncate">
                  {tracks.length > 1 ? `Version ${idx + 1}` : "AI Remix"}
                </p>
                {track.title && <p className="text-xs text-muted-foreground truncate">{track.title}</p>}
                {/* Fake audio bar */}
                <div className="flex items-end gap-[2px] h-4 mt-2">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-[3px] rounded-full bg-primary/40"
                      animate={playing === idx ? { scaleY: [0.3, 1, 0.3] } : {}}
                      transition={playing === idx ? { repeat: Infinity, duration: 0.5 + Math.random() * 0.3, delay: i * 0.03 } : {}}
                      style={{ height: "100%", transformOrigin: "bottom", transform: playing !== idx ? `scaleY(${0.2 + Math.random() * 0.6})` : undefined }}
                    />
                  ))}
                </div>
              </div>
              {/* Play button */}
              <motion.button
                onClick={() => togglePlay(idx)}
                className="flex-shrink-0 h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors border border-primary/20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {playing === idx ? (
                  <Pause className="h-6 w-6 text-primary" />
                ) : (
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <Play className="h-6 w-6 text-primary ml-0.5" />
                  </motion.div>
                )}
              </motion.button>
              <audio
                ref={(el) => { audioRefs.current[idx] = el; }}
                src={track.url}
                onEnded={() => setPlaying(null)}
              />
            </motion.div>
          ))}

          {/* Download + Share buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {tracks.map((track: any, idx: number) => (
              <motion.button
                key={idx}
                onClick={() => downloadTrack(track.url, `${songTitle || 'AI-Remix'}-v${idx + 1}.mp3`)}
                className="relative w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-black text-base overflow-hidden"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  <Download className="h-5 w-5" />
                  Download {tracks.length > 1 ? `V${idx + 1}` : "MP3"} → Upload to Spotify
                </span>
              </motion.button>
            ))}
            <Button
              variant="outline"
              className="border-white/20 hover:bg-white/5 gap-2"
              onClick={() => {
                const url = tracks[0]?.url;
                if (url) {
                  navigator.clipboard.writeText(url);
                  toast.success("Link copied to clipboard!");
                }
              }}
            >
              <Copy className="h-4 w-4" />
              Share Link
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground/60">
            MP3 file • Ready to upload to Spotify, Apple Music, SoundCloud
          </p>
          <div className="flex justify-center pt-2">
            <Button onClick={() => { setStatus("idle"); setResult(null); }} variant="outline" className="border-white/20 hover:bg-white/5">
              Remix Again
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

/* ─── Paywall Banner ─── */
const PaywallBanner = ({ score }: { score: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full rounded-2xl border-2 border-orange-500/40 bg-gradient-to-r from-orange-500/10 to-red-500/10 p-7 text-center"
  >
    <div className="text-4xl mb-3">🔥</div>
    <h3 className="text-xl font-black text-white mb-2">You've used your free analysis for this month</h3>
    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
      Upgrade to Pro for unlimited analyses + 10 AI remixes/month. Your song scored <strong className="text-white">{score}/100</strong> — let's make it go viral.
    </p>
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <Link to="/billing">
        <motion.button
          className="relative px-8 py-3.5 rounded-xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-black text-sm overflow-hidden"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
          />
          <span className="relative">Upgrade to Pro — $19/month</span>
        </motion.button>
      </Link>
      <Link to="/billing">
        <button className="px-6 py-3 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/5 transition-colors">
          Buy Single Analysis — $3
        </button>
      </Link>
    </div>
  </motion.div>
);

/* ─── Remix Paywall Modal ─── */
const RemixPaywallModal = ({ score, songTitle, onClose }: { score: number; songTitle: string; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="relative max-w-md w-full rounded-3xl border-2 border-accent/40 bg-[#0f0f0f] p-8 text-center"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-4xl mb-3">🎵</div>
      <h3 className="text-2xl font-black text-white mb-2">AI Remix is a Pro feature</h3>
      <p className="text-muted-foreground mb-2">
        Your song <strong className="text-white">"{songTitle}"</strong> scored <strong className="text-accent text-lg">{score}/100</strong>.
      </p>
      <p className="text-muted-foreground mb-7">
        Create an AI remix to take it viral — stronger hook, more energy, same vibe.
      </p>
      <div className="flex flex-col gap-3">
        <Link to="/billing" onClick={onClose}>
          <motion.button
            className="relative w-full py-4 rounded-xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-black text-base overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
            />
            <span className="relative">Upgrade to Pro — $19/month</span>
          </motion.button>
        </Link>
        <Link to="/billing" onClick={onClose}>
          <button className="w-full py-3 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/5 transition-colors">
            Buy Single Remix — $7
          </button>
        </Link>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-white transition-colors">
          Maybe later
        </button>
      </div>
    </motion.div>
  </motion.div>
);

/* ═══════════════════════════════════════ */
const Results = () => {
  const location = useLocation();
  const _navigate = useNavigate();
  const state = location.state as { results: any; title: string; goal?: string; uploadedFile?: File; songGenre?: string } | null;

  if (!state?.results) return <Navigate to="/analyze" replace />;

  const { user, profile } = useAuth();
  const [showRemixPaywall, setShowRemixPaywall] = useState(false);
  const plan = (profile?.plan ?? 'free') as keyof typeof PLAN_LIMITS;
  const analysesUsed = profile?.analyses_used ?? 0;
  const analysesLimit = PLAN_LIMITS[plan].analyses;
  const hasExhaustedFreeAnalysis = plan === 'free' && analysesUsed >= analysesLimit;
  const canRemix = plan !== 'free' || profile?.is_admin === true;

  const { results, title, goal, uploadedFile, songGenre } = state;
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

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `My song "${title}" scored ${score}/100 on Viralize! 🎵🔥\n\nCheck yours → viralize.app`
  )}`;

  const profileStats = [
    { icon: Clock, label: "Hook Timing", value: hookTiming },
    { icon: Activity, label: "BPM", value: bpmEstimate },
    { icon: KeyRound, label: "Key", value: musicalKey },
    { icon: Zap, label: "Energy", value: energyLevel },
    { icon: Music, label: "Opening Lyrics", value: openingLyrics },
  ].filter((s) => s.value != null);

  const themeFields = [
    { label: "Theme", value: songTheme },
    { label: "Emotional Core", value: emotionalCore },
  ].filter((f) => f.value);

  return (
    <div className="min-h-screen px-4 pt-24 pb-20 bg-background">
      <div className="container max-w-4xl space-y-16">

        {/* ═══ 1. SCORE + VERDICT ═══ */}
        <Section delay={0} className="flex flex-col items-center text-center">
          <ScoreGauge score={score} />
          <div className="mt-6 space-y-4">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5, duration: 0.4, type: "spring" }}
              className={`inline-block px-5 py-2 rounded-full text-sm font-black border ${badge.cls}`}
            >
              {badge.label}
            </motion.span>
            <h1 className="text-3xl md:text-4xl font-black font-heading text-white tracking-tight">{verdict}</h1>
            <p className="text-lg text-muted-foreground">"{title}"</p>
            {isRealAudio && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold border border-green-500/20 bg-green-500/10 text-green-400"
              >
                <Headphones className="h-3.5 w-3.5" /> Analyzed with Real Audio AI
              </motion.div>
            )}
          </div>
        </Section>

        {/* ═══ SHARE SCORE CARD ═══ */}
        <Section delay={0.05} className="flex justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold gap-2 px-8 h-12 hover:opacity-90 transition-all"
              >
                <Share2 className="h-5 w-5" />
                Share Score Card
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border text-foreground p-0 overflow-hidden rounded-2xl">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="text-lg font-bold">Share Your Score</DialogTitle>
              </DialogHeader>
              <div className="p-6 space-y-5">
                {/* Score Card Preview */}
                <div
                  id="share-score-card"
                  className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#1a1025] to-[#0a0a0a] p-6 border border-primary/20"
                >
                  {/* Decorative elements */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                  <div className="absolute top-4 right-4 text-[10px] font-bold text-primary/60 uppercase tracking-widest">viralize.app</div>

                  <div className="flex items-center gap-5">
                    {/* Score circle */}
                    <div className="relative flex-shrink-0">
                      <svg width="90" height="90" className="-rotate-90">
                        <circle cx="45" cy="45" r="36" fill="none" stroke="hsl(0 0% 15%)" strokeWidth="6" />
                        <circle
                          cx="45" cy="45" r="36" fill="none"
                          stroke={scoreColor(score)}
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 36}
                          strokeDashoffset={2 * Math.PI * 36 - (score / 100) * 2 * Math.PI * 36}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-black text-white">{score}</span>
                      </div>
                    </div>
                    {/* Song info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-lg truncate">{title}</p>
                      <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-[10px] font-black border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mt-5">
                    {bpmEstimate && (
                      <div className="text-center rounded-lg bg-white/5 py-2">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">BPM</p>
                        <p className="text-sm font-bold text-white">{bpmEstimate}</p>
                      </div>
                    )}
                    {hookTiming && (
                      <div className="text-center rounded-lg bg-white/5 py-2">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Hook</p>
                        <p className="text-sm font-bold text-white">{hookTiming}</p>
                      </div>
                    )}
                    <div className="text-center rounded-lg bg-white/5 py-2">
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">Viral</p>
                      <p className="text-sm font-bold text-accent">
                        {Math.min(100, Math.round((score * 0.5) + ((danceability || 5) * 3) + ((valence || 5) * 2)))}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="border-border hover:bg-secondary gap-1.5 text-xs h-10"
                    onClick={() => {
                      const url = `${window.location.origin}/results?shared=true&score=${score}&title=${encodeURIComponent(title)}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Link copied!");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    className="border-border hover:bg-secondary gap-1.5 text-xs h-10"
                    onClick={() => {
                      const text = `My song scored ${score}/100 🎵 Check yours at viralize.ai`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    Share on X
                  </Button>
                  <Button
                    variant="outline"
                    className="border-border hover:bg-secondary gap-1.5 text-xs h-10"
                    onClick={async () => {
                      try {
                        const el = document.getElementById('share-score-card');
                        if (!el) return;
                        const { default: html2canvas } = await import('html2canvas');
                        const canvas = await html2canvas(el, { backgroundColor: '#0a0a0a', scale: 2 });
                        const link = document.createElement('a');
                        link.download = `viralize-score-${score}.png`;
                        link.href = canvas.toDataURL();
                        link.click();
                      } catch {
                        toast.error("Download failed. Try again.");
                      }
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </Section>

        {/* ═══ 1.5 VIRAL POTENTIAL METER ═══ */}
        <Section delay={0.1}>
          <ViralMeter score={score} danceability={danceability} valence={valence} />
        </Section>

        {/* ═══ PAYWALL BANNER (free users who exhausted their analysis) ═══ */}
        {user && hasExhaustedFreeAnalysis && (
          <Section delay={0.12}>
            <PaywallBanner score={score} />
          </Section>
        )}

        {/* ═══ 2. SONG PROFILE ═══ */}
        {(themeFields.length > 0 || profileStats.length > 0) && (
          <Section delay={0.15}>
            <SectionTitle emoji="🎵" title="SONG PROFILE" />
            <div className="glass-card p-6">
              {themeFields.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 mb-6">
                  {themeFields.map((f) => (
                    <div key={f.label}>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{f.label}</span>
                      <p className="text-sm text-foreground mt-1">{f.value}</p>
                    </div>
                  ))}
                </div>
              )}
              {profileStats.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {profileStats.map((stat) => (
                    <div key={stat.label} className="rounded-lg bg-white/5 border border-white/5 p-4 text-center">
                      <stat.icon className="h-4 w-4 mx-auto text-primary mb-2" />
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
                      <div className="text-base font-bold text-white mt-1">{stat.value}</div>
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
            <SectionTitle emoji="🔮" title="THE HONEST TRUTH" />
            <div className="border-l-4 border-primary bg-primary/5 rounded-r-xl p-6">
              <p className="text-xs text-primary font-bold uppercase tracking-wider mb-3">What Our AI Heard About This Song:</p>
              <p className="text-base text-foreground/90 leading-relaxed">{viralPotential}</p>
            </div>
          </Section>
        )}

        {/* ═══ 4. LYRIC INTELLIGENCE ═══ */}
        {(lyricWeakness || lyricFix || hasViralLine) && (
          <Section delay={0.25}>
            <SectionTitle emoji="✍️" title="LYRIC INTELLIGENCE" />
            <div className="glass-card p-6 space-y-6">
              {lyricWeakness && lyricFix && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Weakest moment → Suggested fix</p>
                  <div className="flex flex-col sm:flex-row items-stretch gap-3">
                    <div className="flex-1 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                      <p className="text-sm text-red-400 line-through">"{lyricWeakness}"</p>
                    </div>
                    <div className="flex items-center justify-center sm:px-2">
                      <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90 sm:rotate-0" />
                    </div>
                    <div className="flex-1 rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                      <p className="text-sm text-green-400 font-medium">"{lyricFix}"</p>
                    </div>
                  </div>
                </div>
              )}
              {hasViralLine && (
                <div className="rounded-lg border-2 border-accent/40 bg-accent/10 p-4 glow-gold">
                  <p className="text-xs text-accent font-bold uppercase tracking-wider mb-2">🔥 Viral Line Detected</p>
                  <p className="text-lg font-bold text-accent">"{viralLine}"</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ═══ 5. ALGORITHM SCORES ═══ */}
        {(valence != null || danceability != null || saveRatePrediction || skipRiskMoment) && (
          <Section delay={0.3}>
            <SectionTitle emoji="📊" title="ALGORITHM SCORES" />
            <div className="glass-card p-6 space-y-6">
              {valence != null && (
                <AnimatedBar label="Valence (Sad → Happy)" value={valence} max={10} color="hsl(142 71% 45%)" />
              )}
              {danceability != null && (
                <AnimatedBar label="Danceability" value={danceability} max={10} color="hsl(258 90% 66%)" />
              )}
              {(saveRatePrediction || skipRiskMoment) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {saveRatePrediction && (
                    <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
                      <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Save Rate Prediction</p>
                      <p className="text-lg font-bold text-white">{saveRatePrediction}</p>
                    </div>
                  )}
                  {skipRiskMoment && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Skip Risk</p>
                      </div>
                      <p className="text-sm font-semibold text-red-300">{skipRiskMoment}</p>
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
            <SectionTitle emoji="👥" title="AUDIENCE PROFILE" />
            <div className="grid gap-4 sm:grid-cols-3">
              {targetAudience && (
                <div className="glass-card p-5">
                  <User className="h-5 w-5 text-primary mb-3" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Who They Are</p>
                  <p className="text-sm text-foreground">{targetAudience}</p>
                </div>
              )}
              {listeningMoment && (
                <div className="glass-card p-5">
                  <MapPin className="h-5 w-5 text-primary mb-3" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">When They Listen</p>
                  <p className="text-sm text-foreground">{listeningMoment}</p>
                </div>
              )}
              {tikTokFit && (
                <div className="glass-card p-5">
                  <Smartphone className="h-5 w-5 text-primary mb-3" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">TikTok Fit</p>
                  <p className="text-sm text-foreground">{tikTokFit}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ═══ 7. GENRE COMPARISON — premium song cards ═══ */}
        {similarSongs?.length > 0 && (
          <Section delay={0.4}>
            <SectionTitle emoji="🏆" title="GENRE COMPARISON" />
            <div className="grid gap-5 md:grid-cols-3">
              {similarSongs.slice(0, 3).map((song: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + i * 0.12 }}
                  className="relative rounded-2xl border border-accent/20 bg-gradient-to-b from-accent/[0.06] to-transparent p-6 space-y-3 hover:border-accent/40 transition-all hover:shadow-lg hover:shadow-accent/10 group overflow-hidden"
                >
                  {/* Gold accent line */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                      <Music className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{song.title}</p>
                      <p className="text-xs text-muted-foreground">{song.artist}</p>
                    </div>
                  </div>
                  {song.streams && (
                    <div className="text-2xl font-black text-accent">{song.streams}</div>
                  )}
                  {song.whatTheyHaveThatYouDont && (
                    <div className="pt-3 border-t border-accent/10">
                      <span className="text-[10px] text-accent/70 font-bold uppercase tracking-widest">What they have that you don't</span>
                      <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">{song.whatTheyHaveThatYouDont}</p>
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
            <div className="grid gap-6 md:grid-cols-2">
              {strengths?.length > 0 && (
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold font-heading mb-4 text-white">
                    <span className="text-green-400">✅</span> What's Working
                  </h2>
                  <div className="glass-card p-6 space-y-3">
                    {strengths.map((s: string, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.55 + i * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <div className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="h-3 w-3 text-green-400" />
                        </div>
                        <span className="text-sm text-foreground/80">{s}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {improvements?.length > 0 && (
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold font-heading mb-4 text-white">
                    <span className="text-red-400">❌</span> What to Fix
                  </h2>
                  <div className="glass-card p-6 space-y-3">
                    {improvements.map((s: string, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.55 + i * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <div className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-red-500/20 flex items-center justify-center">
                          <X className="h-3 w-3 text-red-400" />
                        </div>
                        <span className="text-sm text-foreground/80">{s}</span>
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
            <div className="rounded-2xl border-2 border-accent/40 bg-accent/10 p-8 md:p-10 text-center glow-gold">
              <Target className="h-8 w-8 text-accent mx-auto mb-4" />
              <p className="text-xs text-accent font-bold uppercase tracking-widest mb-4">If You Change ONE Thing Before Releasing:</p>
              <p className="text-xl md:text-2xl font-black text-white leading-snug max-w-2xl mx-auto">{oneChange}</p>
              <p className="text-sm text-muted-foreground mt-4 italic">This single change could be the difference between 1,000 and 1,000,000 streams.</p>
            </div>
          </Section>
        )}

        {/* ═══ 10. PLAYLIST TARGETS ═══ */}
        {(playlistStrategy || matchedPlaylists?.length > 0) && (
          <Section delay={0.65}>
            <SectionTitle emoji="📋" title="PLAYLIST TARGETS" />
            {playlistStrategy && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 mb-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/80 leading-relaxed">{playlistStrategy}</p>
                </div>
              </div>
            )}
            {matchedPlaylists?.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {matchedPlaylists.slice(0, 5).map((pl: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + i * 0.05 }}
                    className="glass-card p-5 hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ListMusic className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm text-white">{pl.name}</span>
                    </div>
                    {pl.followers && <p className="text-xs text-muted-foreground">{pl.followers} followers</p>}
                    {pl.reason && <p className="text-xs text-primary/70 mt-1">{pl.reason}</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ═══ 11. 30-DAY ROADMAP ═══ */}
        <Section delay={0.75}>
          <SectionTitle emoji="🗓" title="30-DAY ROADMAP" />
          <div className="relative pl-8">
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-accent to-green-500 rounded-full" />
            <div className="space-y-4">
              {roadmap.map((item, i) => (
                <motion.div
                  key={item.week}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.08 }}
                  className="relative glass-card p-5"
                >
                  <div className="absolute -left-[26px] top-5 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{item.status}</span>
                    <div>
                      <span className="text-sm font-bold text-primary">{item.week}</span>
                      <p className="text-sm text-foreground/80 mt-1">{item.action}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ═══ 12. AI REMIX ═══ */}
        <Section delay={0.85}>
          {canRemix ? (
            <AiRemixSection uploadedFile={uploadedFile || null} songTitle={title} songGenre={songGenre} analysisData={results} />
          ) : (
            <div className="rounded-2xl border-2 border-accent/40 bg-gradient-to-b from-accent/[0.08] to-transparent p-8 md:p-10 text-center relative overflow-hidden">
              <div className="text-5xl mb-4">🎧</div>
              <h2 className="text-2xl md:text-3xl font-black font-heading text-white mb-3">AI Remix — Make It Go Viral</h2>
              <p className="text-muted-foreground mb-2 max-w-md mx-auto">
                AI covers your song with a stronger hook and more viral energy.
              </p>
              <p className="text-sm text-muted-foreground mb-7 max-w-sm mx-auto">
                Your song scored <strong className="text-accent">{score}/100</strong>. Unlock AI Remix to push it to the next level.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <motion.button
                  onClick={() => setShowRemixPaywall(true)}
                  className="relative px-10 py-4 rounded-xl bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-black text-base overflow-hidden"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                  />
                  <span className="relative flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Unlock AI Remix →
                  </span>
                </motion.button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">Pro — $19/month or $7/remix one-time</p>
            </div>
          )}
        </Section>

        {/* ═══ REMIX PAYWALL MODAL ═══ */}
        <AnimatePresence>
          {showRemixPaywall && (
            <RemixPaywallModal score={score} songTitle={title} onClose={() => setShowRemixPaywall(false)} />
          )}
        </AnimatePresence>

        {/* ═══ 13. BOTTOM CTA ═══ */}
        <Section delay={0.9} className="pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="gradient-purple text-primary-foreground font-bold glow-purple hover:opacity-90 transition-all px-10 h-14 text-lg"
            >
              <Link to="/analyze">Analyze Another Song</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/20 hover:bg-white/5 px-8 h-14 text-base font-semibold gap-2"
            >
              <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Share My Score on X
              </a>
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            <Link to="/billing" className="text-accent hover:underline font-medium">
              Upgrade to Pro for unlimited analyses →
            </Link>
          </p>
        </Section>
      </div>
    </div>
  );
};

export default Results;
