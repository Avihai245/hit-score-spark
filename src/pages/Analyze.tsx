import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Upload, Music, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const genres = ["Pop", "Hip Hop", "R&B", "Indie Pop", "Melodic House", "EDM", "Rock", "Latin", "Afrobeats", "Other"];
const goals = [
  { value: "playlists", label: "Get on Spotify playlists" },
  { value: "tiktok", label: "Go viral on TikTok" },
  { value: "label", label: "Impress a label" },
  { value: "streams", label: "Maximize streams" },
];

const analysisSteps = [
  { label: "Uploading audio file", key: "upload", icon: "📤" },
  { label: "Extracting audio patterns", key: "listen", icon: "🎧" },
  { label: "Mapping structure against top-performing tracks", key: "spotify", icon: "🟢" },
  { label: "Analyzing hook timing & retention signals", key: "apple", icon: "🍎" },
  { label: "Matching against global benchmarks", key: "compare", icon: "📊" },
  { label: "Evaluating replay potential & skip risk", key: "audio", icon: "🔊" },
  { label: "Finalizing data-driven insights", key: "report", icon: "📋" },
];

/* ─── Live Data Feed Messages ─── */
const dataFeedMessages = [
  "Extracting audio fingerprint…",
  "Detecting tempo & BPM patterns…",
  "Fetching genre benchmarks from hit data…",
  "Loading chart performance data…",
  "Analyzing hook timing at 0:00–0:15…",
  "Comparing to 847 pattern-matched tracks…",
  "Measuring danceability index…",
  "Checking algorithmic playlist fit…",
  "Calculating valence score…",
  "Evaluating save rate prediction…",
  "Analyzing frequency spectrum…",
  "Genre trend analysis in progress…",
  "Computing skip risk probability…",
  "Matching editorial playlist patterns…",
  "Evaluating lyrical sentiment…",
  "Cross-referencing viral sound patterns…",
  "Building audience demographic profile…",
  "Comparing against thousands of high-performing tracks…",
  "Finalizing data-driven insights…",
];

/* ─── Fake Waveform Preview ─── */
const WaveformPreview = () => {
  const bars = useRef(Array.from({ length: 40 }, () => 15 + Math.random() * 75));
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-end justify-center gap-[2px] h-16 mt-4"
    >
      {bars.current.map((h, i) => (
        <motion.div
          key={i}
          className="w-[4px] rounded-full bg-gradient-to-t from-primary/60 to-primary"
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ delay: i * 0.02, duration: 0.4, ease: "easeOut" }}
        />
      ))}
    </motion.div>
  );
};

/* ─── Bouncing Waveform for Loading ─── */
const LoadingWaveform = () => (
  <div className="flex items-end justify-center gap-2 h-24">
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <motion.div
        key={i}
        className="w-3 rounded-full gradient-purple"
        animate={{ scaleY: [0.3, 1, 0.3] }}
        transition={{
          repeat: Infinity,
          duration: 0.7,
          delay: i * 0.1,
          ease: "easeInOut",
        }}
        style={{ height: "100%", transformOrigin: "bottom" }}
      />
    ))}
  </div>
);

/* ─── Platform Logos ─── */
const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const AppleMusicIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.8.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03c.525 0 1.048-.034 1.57-.1.823-.106 1.597-.35 2.296-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.862.37-1.314.1-.6.15-1.206.154-1.814V6.124zM17.884 18.63c-.026.504-.1.98-.345 1.424-.385.698-1.003 1.078-1.79 1.15-.19.02-.38.024-.57.012-.657-.04-1.284-.21-1.89-.45-.755-.3-1.474-.686-2.196-1.066a7.27 7.27 0 01-.387-.216c-.228-.136-.432-.298-.61-.492-.256-.28-.378-.608-.383-.98V8.873c0-.12.01-.24.03-.36.06-.37.23-.67.53-.9.26-.2.56-.32.88-.41.28-.08.57-.12.86-.15.27-.03.55-.04.82-.03.3.01.59.05.87.13.39.11.74.3 1.04.57.23.21.38.46.43.77.03.17.04.34.04.52v9.12c0 .04 0 .08-.01.12-.03.33-.17.6-.42.82-.22.2-.49.32-.78.39-.16.04-.32.06-.49.07-.33.02-.66 0-.98-.07z"/>
  </svg>
);

/* ─── Live Data Feed ─── */
const LiveDataFeed = ({ elapsedSeconds }: { elapsedSeconds: number }) => {
  const [visibleMessages, setVisibleMessages] = useState<string[]>([]);

  useEffect(() => {
    const idx = Math.min(Math.floor(elapsedSeconds / 2), dataFeedMessages.length - 1);
    const msgs = dataFeedMessages.slice(0, idx + 1).reverse().slice(0, 5);
    setVisibleMessages(msgs);
  }, [elapsedSeconds]);

  return (
    <div className="w-full space-y-1 max-h-[120px] overflow-hidden">
      <AnimatePresence mode="popLayout">
        {visibleMessages.map((msg, i) => (
          <motion.div
            key={msg}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: i === 0 ? 1 : 0.4 - i * 0.08, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-xs font-mono"
          >
            {msg.includes("Spotify") ? (
              <span className="text-green-400"><SpotifyIcon /></span>
            ) : msg.includes("Apple") ? (
              <span className="text-pink-400"><AppleMusicIcon /></span>
            ) : (
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              />
            )}
            <span className={i === 0 ? "text-white/80" : "text-white/30"}>{msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const saveAnalysisToSupabase = async (userId: string, data: {
  title: string;
  genre: string;
  score: number;
  verdict: string;
  fullResult: any;
}): Promise<string | null> => {
  try {
    const { data: inserted, error } = await supabase.from('viralize_analyses').insert({
      user_id: userId,
      title: data.title,
      genre: data.genre,
      score: data.score,
      verdict: data.verdict,
      full_result: data.fullResult,
    }).select('id').single();
    if (error) throw error;
    const analysisId = inserted?.id || null;
    // Increment analyses_this_month
    const { error: rpcError } = await supabase.rpc('increment_analyses_this_month', { user_id_param: userId });
    if (rpcError) {
      // If RPC doesn't exist, do a manual update
      const { data: userData } = await supabase
        .from('viralize_users')
        .select('analyses_used, analyses_this_month')
        .eq('id', userId)
        .single();
      if (userData) {
        await supabase.from('viralize_users').update({
          analyses_used: (userData.analyses_used || 0) + 1,
          analyses_this_month: (userData.analyses_this_month || 0) + 1,
        }).eq('id', userId);
      }
    }
    return analysisId;
  } catch (err) {
    console.warn('Failed to save analysis:', err);
    return null;
  }
};

const Analyze = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [goal, setGoal] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) {
      setElapsedSeconds(0);
      elapsedRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    }
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, [loading]);

  const markStep = (step: number) => {
    setCompletedSteps(prev => [...prev, step]);
    if (step < analysisSteps.length - 1) setCurrentStep(step + 1);
  };

  const acceptFile = useCallback((f: File) => {
    const valid = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/wave"];
    if (!valid.includes(f.type) && !f.name.match(/\.(mp3|wav)$/i)) {
      toast({ title: "Invalid file", description: "Please upload an MP3 or WAV file.", variant: "destructive" });
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 100MB.", variant: "destructive" });
      return;
    }
    setFile(f);
  }, [toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  }, [acceptFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "No file", description: "Please upload an audio file.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setCurrentStep(0);
    setCompletedSteps([]);

    try {
      // Step 1 – Get presigned upload URL
      const urlRes = await fetch((import.meta.env.VITE_LAMBDA_URL || "https://u2yjblp3w5.execute-api.eu-west-1.amazonaws.com/prod/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-upload-url", fileName: file.name }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, s3Key } = await urlRes.json();

      // Step 2 – Upload file directly to S3
      const uploadRes = await fetch(uploadUrl, { method: "PUT", body: file });
      if (!uploadRes.ok) throw new Error("S3 upload failed");
      markStep(0); // Upload done

      // Step 3 – Start async analysis
      setCurrentStep(1);
      const analysisRes = await fetch((import.meta.env.VITE_LAMBDA_URL || "https://u2yjblp3w5.execute-api.eu-west-1.amazonaws.com/prod/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          s3Key,
          title: title.trim() || undefined,
          genre: genre || undefined,
          goal: goal || undefined,
        }),
      });
      if (!analysisRes.ok) throw new Error("Analysis failed to start");
      const analysisData = await analysisRes.json();
      const { jobId } = analysisData;

      if (!jobId) {
        if (analysisData.score != null) {
          let analysisId: string | null = null;
          if (user) {
            analysisId = await saveAnalysisToSupabase(user.id, {
              title: title || file.name,
              genre: genre || analysisData.genre || '',
              score: analysisData.score,
              verdict: analysisData.verdict || '',
              fullResult: analysisData,
            });
          }
          navigate("/results", { state: { results: analysisData, title: title || file.name, goal, uploadedFile: file, songGenre: genre, analysisId } });
          return;
        }
        throw new Error("No jobId received from server");
      }

      markStep(1); // AI Listening done

      // Step 4 – Poll every 3 seconds
      const maxPollTime = 120000;
      const pollStart = Date.now();
      let pollCount = 0;

      const pollResult = async () => {
        if (Date.now() - pollStart > maxPollTime) {
          setLoading(false);
          toast({
            title: "Timeout",
            description: "Analysis taking longer than expected. Please try again with a shorter MP3 file (under 5 minutes).",
            variant: "destructive",
          });
          return;
        }

        pollCount++;
        // Progressive step markers for platform scanning
        if (pollCount >= 1 && !completedSteps.includes(2)) markStep(2); // Spotify
        if (pollCount >= 2 && !completedSteps.includes(3)) markStep(3); // Apple Music
        if (pollCount >= 3 && !completedSteps.includes(4)) markStep(4); // Cross-ref
        if (pollCount >= 4 && !completedSteps.includes(5)) markStep(5); // Audio analysis

        try {
          const res = await fetch((import.meta.env.VITE_LAMBDA_URL || "https://u2yjblp3w5.execute-api.eu-west-1.amazonaws.com/prod/analyze"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "poll", jobId }),
          });
          const data = await res.json();

          if (data.status === "complete") {
            markStep(6); // Report generated
            // Save to Supabase if logged in
            let analysisId: string | null = null;
            if (user) {
              analysisId = await saveAnalysisToSupabase(user.id, {
                title: title || file.name,
                genre: genre || data.genre || '',
                score: data.score || 0,
                verdict: data.verdict || '',
                fullResult: data,
              });
            }
            setTimeout(() => {
              setLoading(false);
              navigate("/results", { state: { results: data, title: title || file.name, goal, uploadedFile: file, songGenre: genre, analysisId } });
            }, 600);
          } else if (data.status === "error") {
            setLoading(false);
            toast({ title: "Analysis failed", description: "Something went wrong. Please try again.", variant: "destructive" });
          } else {
            setTimeout(pollResult, 3000);
          }
        } catch {
          setLoading(false);
          toast({ title: "Connection error", description: "Lost connection to server. Please try again.", variant: "destructive" });
        }
      };

      setTimeout(pollResult, 3000);
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || "Something went wrong.";
      toast({ title: "Analysis failed", description: `${msg} Please try again.`, variant: "destructive" });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 max-w-lg w-full"
        >
           <div className="relative">
            <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-primary/20 blur-3xl" />
            <LoadingWaveform />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-heading text-foreground">
              Running global pattern analysis...
            </p>
            <p className="text-xs text-muted-foreground mt-1">Comparing against thousands of high-performing tracks</p>
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">{elapsedSeconds}s elapsed</p>
          </div>

          {/* Platform badges */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold"
            >
              <SpotifyIcon /> Spotify
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold"
            >
              <AppleMusicIcon /> Apple Music
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold"
            >
              📊 500K+ Songs
            </motion.div>
          </div>

          {/* Step progress */}
          <div className="w-full space-y-2">
            {analysisSteps.map((step, i) => {
              const isCompleted = completedSteps.includes(i);
              const isCurrent = currentStep === i && !isCompleted;
              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all",
                    isCompleted
                      ? "border-green-500/30 bg-green-500/10"
                      : isCurrent
                        ? "border-primary/30 bg-primary/10"
                        : "border-white/5 bg-white/[0.02] opacity-40"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs",
                    isCompleted
                      ? "bg-green-500"
                      : isCurrent
                        ? "bg-primary/30 border-2 border-primary"
                        : "bg-white/10"
                  )}>
                    {isCompleted ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
                        <Check className="h-3.5 w-3.5 text-white" />
                      </motion.div>
                    ) : isCurrent ? (
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">{step.icon}</span>
                    )}
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    isCompleted ? "text-green-400" : isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                    {isCompleted && " ✓"}
                    {isCurrent && "..."}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Live data feed */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="w-full rounded-xl border border-white/5 bg-white/[0.02] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                className="w-2 h-2 rounded-full bg-green-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Live Data Feed</span>
            </div>
            <LiveDataFeed elapsedSeconds={elapsedSeconds} />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-32 pb-12 bg-background">
      <div className="container max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-black font-heading text-center mb-2 text-foreground">Run Your Track Through Our Analysis Engine</h1>
          <p className="text-center text-muted-foreground mb-3">
            Upload your track and get data-driven insights in ~90 seconds
          </p>
          <p className="text-center text-[11px] text-muted-foreground/60 mb-10">
            Based on patterns from top-performing tracks across Spotify • Apple Music • TikTok • YouTube
          </p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* LEFT – Upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => {
                const inp = document.createElement("input");
                inp.type = "file";
                inp.accept = ".mp3,.wav,audio/mpeg,audio/wav";
                inp.onchange = () => { if (inp.files?.[0]) acceptFile(inp.files[0]); };
                inp.click();
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed min-h-[380px] transition-all relative overflow-hidden",
                dragOver
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : file
                    ? "border-accent/40 bg-accent/5"
                    : "border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 bg-card/30"
              )}
            >
              {file ? (
                <div className="flex flex-col items-center gap-3 p-6 w-full">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center"
                  >
                    <Music className="h-10 w-10 text-accent" />
                  </motion.div>
                  <div className="text-center">
                    <p className="font-bold text-lg text-white">{file.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{formatSize(file.size)}</p>
                  </div>
                  {/* Waveform preview */}
                  <WaveformPreview />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3 rounded-full border border-border px-3 py-1.5 transition-colors"
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                </div>
              ) : (
                <>
                  <motion.div
                    animate={dragOver ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                    className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    <Upload className="h-12 w-12 text-primary" />
                  </motion.div>
                  <div className="text-center">
                    <p className="font-bold text-xl text-foreground">Drop your track here</p>
                    <p className="text-sm text-muted-foreground mt-2">MP3 or WAV · max 100 MB</p>
                    <p className="text-xs text-muted-foreground/60 mt-1.5">Run your track through our global analysis engine</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                  </div>
                  {dragOver && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-primary font-bold text-lg"
                    >
                      Drop it! 🎵
                    </motion.p>
                  )}
                </>
              )}
            </div>

            {/* RIGHT – Fields */}
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Song Title <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  placeholder="Enter your song title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Genre <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  What's your goal? <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {goals.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={!file}
                className="w-full h-14 gradient-purple text-primary-foreground text-lg font-bold glow-purple hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Analyze Now →
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" /> Your song is never stored or shared
              </p>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default Analyze;
