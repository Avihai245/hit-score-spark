import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Upload, Music, X, Check, Zap, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ParticleField } from "@/components/ParticleField";
import { DataStream, ScanLine } from "@/components/DataStream";

const genres = ["Pop", "Hip Hop", "R&B", "Indie Pop", "Melodic House", "EDM", "Rock", "Latin", "Afrobeats", "Other"];
const goals = [
  { value: "playlists", label: "Get on Spotify playlists" },
  { value: "tiktok", label: "Go viral on TikTok" },
  { value: "label", label: "Impress a label" },
  { value: "streams", label: "Maximize streams" },
];

const analysisSteps = [
  { label: "Uploading & reading audio file", key: "upload", platform: null, color: "text-muted-foreground" },
  { label: "Scanning Spotify hit patterns & playlist data", key: "spotify", platform: "spotify", color: "text-emerald-400" },
  { label: "Analyzing Apple Music chart performance", key: "apple", platform: "apple", color: "text-pink-400" },
  { label: "Cross-referencing YouTube & TikTok viral trends", key: "compare", platform: "youtube", color: "text-red-400" },
  { label: "Mapping hook timing & skip-risk signals", key: "audio", platform: null, color: "text-accent" },
  { label: "Benchmarking against 500K+ top-performing tracks", key: "benchmark", platform: null, color: "text-primary" },
  { label: "Generating your personalized hit report", key: "report", platform: null, color: "text-foreground" },
];

/* ─── Live Data Feed Messages ─── */
const dataFeedMessages = [
  "Connecting to Spotify catalog data…",
  "Pulling playlist placement patterns…",
  "Extracting tempo & BPM signature…",
  "Scanning Apple Music editorial trends…",
  "Loading TikTok viral sound fingerprints…",
  "Comparing hook timing across 847 hits…",
  "Measuring danceability & energy index…",
  "Checking algorithmic playlist fit score…",
  "Analyzing save-rate prediction model…",
  "Cross-referencing YouTube trending data…",
  "Mapping frequency spectrum to hit profiles…",
  "Evaluating skip risk at 0:03, 0:15, 0:30…",
  "Computing replay potential score…",
  "Matching against editorial playlist DNA…",
  "Scoring viral coefficient across platforms…",
  "Building your personalized hit blueprint…",
];

/* ─── Fake Waveform Preview ─── */
const WaveformPreview = () => {
  const bars = useRef(Array.from({ length: 60 }, () => 15 + Math.random() * 75));
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-end justify-center gap-[2px] h-20 mt-4"
    >
      {bars.current.map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-primary/40 via-primary to-accent"
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ delay: i * 0.015, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        />
      ))}
    </motion.div>
  );
};

/* ─── Bouncing Waveform for Loading ─── */
const LoadingWaveform = () => (
  <div className="flex items-end justify-center gap-1.5 h-28 relative z-20">
    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <motion.div
        key={i}
        className="w-3 rounded-full bg-gradient-to-t from-primary via-primary to-accent shadow-[0_0_12px_2px] shadow-primary/40"
        animate={{ scaleY: [0.2, 1, 0.2] }}
        transition={{
          repeat: Infinity,
          duration: 0.6,
          delay: i * 0.08,
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
  <svg viewBox="0 0 361 361" className="h-4 w-4">
    <defs>
      <linearGradient id="am-grad" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#FA233B" />
        <stop offset="100%" stopColor="#FB5C74" />
      </linearGradient>
    </defs>
    <rect width="361" height="361" rx="80" fill="url(#am-grad)" />
    <path d="M255 96.5v131.3c0 15.1-10.4 28.2-25.1 32.1-5.3 1.4-10.9 1.7-16.3.9-14.6-2.2-25.1-14-25.1-28.2 0-15.8 13.6-28.5 30.4-28.5 5.5 0 10.7 1.3 15.2 3.7V137l-96 22.5v108.3c0 15.1-10.4 28.2-25.1 32.1-5.3 1.4-10.9 1.7-16.3.9-14.6-2.2-25.1-14-25.1-28.2 0-15.8 13.6-28.5 30.4-28.5 5.5 0 10.7 1.3 15.2 3.7V128.5c0-8.5 5.8-15.9 14-18l91.8-21.5c11.5-2.7 21.9 5.7 21.9 17.3v-9.8z" fill="#fff"/>
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://euszgnaahwmdbfdewaky.supabase.co';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1c3pnbmFhaHdtZGJmZGV3YWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2Njk5NTAsImV4cCI6MjA4OTI0NTk1MH0.oTg96pXF8PraxphGOCszHuP8SoMpCBDXL6C48OrNbEI';

/**
 * Enriches Lambda's raw analysis with real Spotify viral DNA via Claude.
 * Falls back to raw Lambda result if the Edge Function is unavailable.
 */
const enrichWithSpotifyDna = async (
  lambdaResult: any,
  title: string,
  genre: string,
  goal: string,
  analysisId?: string | null,
  fileSizeBytes?: number,
): Promise<any> => {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/analyze-song`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON}`,
      },
      body: JSON.stringify({ lambdaResult, title, genre, goal, analysisId, fileSizeBytes }),
    });
    if (!res.ok) {
      console.warn('analyze-song edge function returned', res.status, '— using Lambda result');
      return lambdaResult;
    }
    return await res.json();
  } catch (e) {
    console.warn('analyze-song unavailable, using Lambda result:', e);
    return lambdaResult;
  }
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
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const prefill = (location.state as any)?.prefill;
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [file, setFile] = useState<File | null>(prefill?.file || null);
  const [title, setTitle] = useState(prefill?.title || "");
  const [genre, setGenre] = useState(prefill?.genre || "");
  const [goal, setGoal] = useState(prefill?.goal || "");
  const [dragOver, setDragOver] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSubmitRef = useRef(false);

  // Auto-submit if coming from free trial with a file
  useEffect(() => {
    if (prefill?.freeTrial && prefill?.file && !autoSubmitRef.current) {
      autoSubmitRef.current = true;
      // Small delay to let the component mount
      const timer = setTimeout(() => {
        const form = document.querySelector('form');
        if (form) form.requestSubmit();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [prefill]);

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
    if (!title.trim()) {
      toast({ title: "Song title required", description: "Please enter your song title.", variant: "destructive" });
      return;
    }
    if (!file) {
      toast({ title: "No file", description: "Please upload an audio file.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setTimedOut(false);
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
          // Enrich with real Spotify viral DNA + Claude
          const enriched = await enrichWithSpotifyDna(analysisData, title || file.name, genre || analysisData.genre || '', goal || '', analysisId, file?.size);
          navigate("/results", { state: { results: enriched, title: title || file.name, goal, uploadedFile: file, songGenre: genre, analysisId, s3Key } });
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
          setTimedOut(true);
          toast({
            title: "Analysis timed out",
            description: "Your file and settings are saved — just click Analyze again to retry.",
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
            // Save raw Lambda result to Supabase first
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
            // Enrich with real Spotify viral DNA + Claude (updates the saved record too)
            const enriched = await enrichWithSpotifyDna(data, title || file.name, genre || data.genre || '', goal || '', analysisId, file?.size);
            setTimeout(() => {
              setLoading(false);
              navigate("/results", { state: { results: enriched, title: title || file.name, goal, uploadedFile: file, songGenre: genre, analysisId, s3Key } });
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
      <div className="flex min-h-screen items-center justify-center px-4 pt-28 pb-8 bg-background relative overflow-hidden z-0">
        {/* Cinematic background — capped below header */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <ParticleField count={60} color="hsl(258, 90%, 66%)" speed={0.8} />
          <DataStream columns={10} />
          <ScanLine />
        </div>

        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 max-w-lg w-full relative z-10"
        >
           <div className="relative">
            <motion.div
              className="absolute inset-0 w-36 h-36 mx-auto rounded-full bg-primary/20 blur-[80px]"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            <LoadingWaveform />
          </div>
          <div className="text-center">
            <motion.p
              className="text-xl font-black font-heading text-foreground"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
               Scanning global hit data...
             </motion.p>
             <p className="text-xs text-muted-foreground mt-1">Pulling real patterns from Spotify, Apple Music & YouTube charts</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
              <p className="text-sm text-muted-foreground tabular-nums">{elapsedSeconds}s elapsed</p>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="w-full max-w-sm">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden relative">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary"
                style={{ backgroundSize: '200% 100%' }}
                animate={{ width: `${Math.min(95, (completedSteps.length / analysisSteps.length) * 100)}%`, backgroundPosition: ['0% 0%', '100% 0%'] }}
                transition={{ width: { duration: 0.5 }, backgroundPosition: { repeat: Infinity, duration: 2, ease: 'linear' } }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              />
            </div>
          </div>

          {/* Platform data sources */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold"
            >
              <SpotifyIcon /> Hit Patterns
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold"
            >
              <AppleMusicIcon /> Chart Data
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold"
            >
              📊 500K+ Benchmarks
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
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : isCurrent
                        ? "border-primary/30 bg-primary/10 shadow-[0_0_20px_-5px] shadow-primary/20"
                        : "border-border/30 bg-card/30 opacity-40"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
                    isCompleted
                      ? "bg-emerald-500"
                      : isCurrent
                        ? "bg-primary/20 border-2 border-primary"
                        : "bg-muted/50"
                  )}>
                    {isCompleted ? (
                      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500 }}>
                        <Check className="h-3.5 w-3.5 text-white" />
                      </motion.div>
                    ) : isCurrent ? (
                      <motion.div
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{ scale: [1, 1.8, 1], opacity: [1, 0.4, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                      />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {step.platform === "spotify" && <SpotifyIcon />}
                    {step.platform === "apple" && <AppleMusicIcon />}
                    <span className={cn(
                      "text-sm font-medium truncate",
                      isCompleted ? "text-emerald-400" : isCurrent ? step.color : "text-muted-foreground/50"
                    )}>
                      {step.label}
                    </span>
                  </div>
                  {isCompleted && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[10px] text-emerald-400/70 font-mono flex-shrink-0"
                    >
                      DONE
                    </motion.span>
                  )}
                  {isCurrent && (
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="text-[10px] text-primary font-mono flex-shrink-0"
                    >
                      SCANNING
                    </motion.span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Live data feed */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="w-full rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 relative overflow-hidden"
          >
            <ScanLine />
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/50"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Live Analysis Feed</span>
              <span className="text-[10px] text-muted-foreground/50 ml-auto">Updated moments ago</span>
            </div>
            <LiveDataFeed elapsedSeconds={elapsedSeconds} />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-32 pb-12 bg-background relative overflow-hidden">
      {/* Ambient background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/[0.03] blur-[100px]" />
      </div>

      <div className="container max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 space-y-5"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/[0.08] border border-primary/20 text-sm font-semibold text-primary backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Global Music Intelligence Engine — Active
          </span>
          <h1 className="text-3xl md:text-5xl font-black font-heading text-foreground">
            Run Your Track Through Our{" "}
            <span className="gradient-text">Analysis Engine</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload your track and get data-driven insights in ~90 seconds.
            Based on patterns from top-performing tracks across Spotify • Apple Music • TikTok • YouTube.
          </p>
        </motion.div>

        {timedOut && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300"
          >
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold">Analysis timed out</p>
              <p className="text-amber-300/70 text-xs mt-0.5">Your file and settings are saved below. Click <strong>Analyze</strong> to try again — shorter files (&lt;5 min) process faster.</p>
            </div>
          </motion.div>
        )}

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
                "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed min-h-[380px] transition-all relative overflow-hidden group",
                dragOver
                  ? "border-primary bg-primary/10 scale-[1.02] shadow-[0_0_40px_-10px] shadow-primary/30"
                  : file
                    ? "border-accent/40 bg-accent/5"
                    : "border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 bg-card/30 hover:shadow-[0_0_30px_-10px] hover:shadow-primary/20"
              )}
            >
              {/* Ambient glow on hover */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/5 blur-[80px]" />
              </div>
              {file ? (
                <div className="flex flex-col items-center gap-3 p-6 w-full relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center relative"
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full bg-accent/20 blur-xl"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    <Music className="h-10 w-10 text-accent relative z-10" />
                  </motion.div>
                  <div className="text-center">
                    <p className="font-bold text-lg text-foreground">{file.name}</p>
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
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <motion.div
                    animate={dragOver ? { scale: 1.15, y: -8 } : { scale: 1, y: 0 }}
                    className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center relative"
                  >
                    <motion.div
                      className="absolute inset-[-8px] rounded-full border-2 border-dashed border-primary/20"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    />
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
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-primary font-bold text-lg"
                    >
                      Drop it! 🎵
                    </motion.p>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT – Fields */}
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Song Title <span className="text-destructive">*</span>
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

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={!file}
                  className="w-full h-14 gradient-purple text-primary-foreground text-lg font-bold hover:opacity-90 transition-all disabled:opacity-40 gap-2 relative overflow-hidden group shadow-[0_0_30px_-5px] shadow-primary/30"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  />
                  <Zap className="h-5 w-5 relative z-10" /> <span className="relative z-10">Analyze Now →</span>
                </Button>
              </motion.div>

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
