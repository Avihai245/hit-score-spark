import { useLocation, Link, Navigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Check, X, Target, ListMusic, Lightbulb, Clock, Activity, Zap,
  Headphones, Music, User, AlertTriangle, KeyRound, MapPin, Smartphone,
  ArrowRight, ChevronRight, Download, Share2, Upload, Play, Pause, Loader2
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";

/* ─── Score color helper ─── */
const scoreColor = (s: number) => {
  if (s < 40) return "hsl(0 84% 60%)";
  if (s < 65) return "hsl(25 95% 53%)";
  if (s < 80) return "hsl(48 96% 53%)";
  return "hsl(142 71% 45%)";
};

const scoreBadge = (s: number) => {
  if (s < 40) return { label: "NEEDS WORK", cls: "bg-red-500/15 text-red-400 border-red-500/30" };
  if (s < 65) return { label: "PROMISING", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" };
  if (s < 80) return { label: "STRONG", cls: "bg-green-500/15 text-green-400 border-green-500/30" };
  return { label: "HIT POTENTIAL", cls: "gradient-purple text-white border-primary/40" };
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
    const ctrl = animate(count, score, { duration: 1.6, ease: "easeOut" });
    return ctrl.stop;
  }, [count, score]);

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute w-64 h-64 rounded-full blur-3xl opacity-30" style={{ backgroundColor: color }} />
      <svg width="280" height="280" className="-rotate-90">
        <circle cx="140" cy="140" r={r} fill="none" stroke="hsl(0 0% 10%)" strokeWidth="14" />
        <motion.circle
          cx="140" cy="140" r={r} fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        />
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
const Section = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
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
      { week: "Week 2", action: "Re-analyze on HitCheck. Target 80+ before release. Fine-tune the hook.", status: "🟡" },
      { week: "Week 3", action: "Once score hits 80+, set up pre-save and begin curator outreach.", status: "🟢" },
      { week: "Week 4", action: "Release and promote. Track data daily. Submit to playlists listed below.", status: "🟢" },
    ];
  }
  return [
    { week: "Week 1", action: "Focus on the improvements listed above. Consider re-writing the weakest sections.", status: "🔴" },
    { week: "Week 2", action: "Re-record with improvements. Pay attention to hook timing and energy levels.", status: "🔴" },
    { week: "Week 3", action: "Re-analyze on HitCheck. Iterate until you hit 65+. Don't release below that.", status: "🟡" },
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

/* ─── AI Remix Section ─── */
const AiRemixSection = ({ uploadedFile, songTitle, songGenre }: { uploadedFile: File | null; songTitle: string; songGenre?: string }) => {
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "complete" | "error">("idle");
  const [style, setStyle] = useState("same");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [file, setFile] = useState<File | null>(uploadedFile);
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

  const startRemix = async () => {
    if (!file) return;
    setStatus("uploading");
    setError("");
    setElapsed(0);

    try {
      // Re-upload
      const urlRes = await fetch("https://hitcheck.vercel.app/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-upload-url", fileName: file.name }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, s3Key } = await urlRes.json();
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "audio/mpeg" } });

      // Start cover
      setStatus("processing");
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);

      const coverRes = await fetch("https://hitcheck.vercel.app/api/suno-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3Key, title: songTitle, genre: songGenre, style }),
      });
      if (!coverRes.ok) throw new Error("Failed to start remix");
      const { taskId } = await coverRes.json();

      // Poll
      const poll = async () => {
        try {
          const res = await fetch("https://hitcheck.vercel.app/api/suno-cover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId }),
          });
          const data = await res.json();
          if (data.status === "complete") {
            clearInterval(timerRef.current);
            setResult(data);
            setStatus("complete");
          } else if (data.status === "failed") {
            clearInterval(timerRef.current);
            setError(data.message || "Remix failed. Try again.");
            setStatus("error");
          } else {
            setTimeout(poll, 5000);
          }
        } catch {
          clearInterval(timerRef.current);
          setError("Connection lost. Try again.");
          setStatus("error");
        }
      };
      setTimeout(poll, 5000);
    } catch (err: any) {
      clearInterval(timerRef.current);
      setError(err?.message || "Something went wrong.");
      setStatus("error");
    }
  };

  useEffect(() => () => { clearInterval(timerRef.current); }, []);

  const tracks = result?.tracks || (result?.audioUrl ? [{ url: result.audioUrl, title: "AI Remix" }] : []);

  return (
    <div className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-8 md:p-10 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black font-heading text-white">🎧 AI Remix — Make It Go Viral</h2>
        <p className="text-sm text-muted-foreground">AI covers your song with the same vibe but stronger hook and viral energy</p>
      </div>

      {status === "idle" && (
        <div className="flex flex-col items-center gap-4">
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
          <Button
            onClick={startRemix}
            disabled={!file}
            className="gradient-purple text-primary-foreground font-bold glow-purple hover:opacity-90 px-10 h-14 text-lg disabled:opacity-40"
          >
            Create AI Remix
          </Button>
          <p className="text-xs text-muted-foreground">Takes 30–90 seconds</p>
        </div>
      )}

      {(status === "uploading" || status === "processing") && (
        <div className="flex flex-col items-center gap-4 py-6">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-lg font-semibold text-white">
            {status === "uploading" ? "Uploading your song..." : "Creating your remix..."}
          </p>
          {status === "processing" && (
            <p className="text-sm text-muted-foreground tabular-nums">{elapsed}s elapsed</p>
          )}
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-8 rounded-full bg-primary/60"
                animate={{ scaleY: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                style={{ transformOrigin: "bottom" }}
              />
            ))}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4 py-4">
          <p className="text-red-400 font-medium">{error}</p>
          <Button onClick={() => { setStatus("idle"); setError(""); }} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
            Try Again
          </Button>
        </div>
      )}

      {status === "complete" && tracks.length > 0 && (
        <div className="space-y-4">
          {result?.coverArt && (
            <div className="flex justify-center">
              <img src={result.coverArt} alt="Remix cover" className="w-40 h-40 rounded-xl object-cover border-2 border-accent/30" />
            </div>
          )}
          {tracks.map((track: any, idx: number) => (
            <div key={idx} className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center gap-4">
              <button
                onClick={() => togglePlay(idx)}
                className="flex-shrink-0 h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
              >
                {playing === idx ? <Pause className="h-5 w-5 text-primary" /> : <Play className="h-5 w-5 text-primary ml-0.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {tracks.length > 1 ? `Version ${idx + 1}` : "AI Remix"}
                </p>
                {track.title && <p className="text-xs text-muted-foreground truncate">{track.title}</p>}
              </div>
              <a
                href={track.url}
                download
                className="flex-shrink-0 h-9 w-9 rounded-lg bg-accent/20 flex items-center justify-center hover:bg-accent/30 transition-colors"
              >
                <Download className="h-4 w-4 text-accent" />
              </a>
              <audio
                ref={(el) => { audioRefs.current[idx] = el; }}
                src={track.url}
                onEnded={() => setPlaying(null)}
              />
            </div>
          ))}
          <div className="flex justify-center gap-3 pt-2">
            <Button onClick={() => { setStatus("idle"); setResult(null); }} variant="outline" className="border-white/20 hover:bg-white/5">
              Remix Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════ */
const Results = () => {
  const location = useLocation();
  const state = location.state as { results: any; title: string; goal?: string; uploadedFile?: File; songGenre?: string } | null;

  if (!state?.results) return <Navigate to="/analyze" replace />;

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
    `My song "${title}" scored ${score}/100 on HitCheck! 🎵🔥\n\nCheck yours → hitcheck.app`
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
    <div className="min-h-screen px-4 pt-24 pb-20 bg-[#0a0a0a]">
      <div className="container max-w-4xl space-y-16">

        {/* ═══ 1. SCORE + VERDICT ═══ */}
        <Section delay={0} className="flex flex-col items-center text-center">
          <ScoreGauge score={score} />
          <div className="mt-6 space-y-4">
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold border ${badge.cls}`}>
              {badge.label}
            </span>
            <h1 className="text-3xl md:text-4xl font-black font-heading text-white tracking-tight">{verdict}</h1>
            <p className="text-lg text-muted-foreground">"{title}"</p>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium border border-white/10 bg-white/5">
              {isRealAudio ? (
                <><Headphones className="h-4 w-4 text-primary" /> Real Audio Analysis</>
              ) : (
                <>📊 Genre Estimate</>
              )}
            </div>
          </div>
        </Section>

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

        {/* ═══ 7. SONGS LIKE YOURS ═══ */}
        {similarSongs?.length > 0 && (
          <Section delay={0.4}>
            <SectionTitle emoji="🏆" title="SONGS LIKE YOURS THAT BLEW UP" />
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
              {similarSongs.slice(0, 3).map((song: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45 + i * 0.08 }}
                  className="glass-card p-5 min-w-[280px] flex-shrink-0 snap-start space-y-3 hover:border-primary/20 transition-colors"
                >
                  <div className="font-bold text-white">{song.title}</div>
                  <div className="text-sm text-muted-foreground">{song.artist}</div>
                  {song.streams && (
                    <div className="text-2xl font-black text-primary">{song.streams}</div>
                  )}
                  {song.whatTheyHaveThatYouDont && (
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-xs text-muted-foreground italic">What they have that you don't:</span>
                      <p className="text-sm text-foreground/80 mt-1">{song.whatTheyHaveThatYouDont}</p>
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
          <AiRemixSection uploadedFile={uploadedFile || null} songTitle={title} songGenre={songGenre} />
        </Section>

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
            <Link to="/pricing" className="text-accent hover:underline font-medium">
              Upgrade to Pro for unlimited analyses →
            </Link>
          </p>
        </Section>
      </div>
    </div>
  );
};

export default Results;
