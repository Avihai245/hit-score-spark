import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Upload, Music, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const genres = ["Pop", "Hip Hop", "R&B", "Indie Pop", "Melodic House", "EDM", "Rock", "Latin", "Afrobeats", "Other"];
const goals = [
  { value: "playlists", label: "Get on Spotify playlists" },
  { value: "tiktok", label: "Go viral on TikTok" },
  { value: "label", label: "Impress a label" },
  { value: "streams", label: "Maximize streams" },
];

const analysisSteps = [
  { label: "Uploading your song", key: "upload" },
  { label: "AI Listening to your track", key: "listen" },
  { label: "Comparing to 500+ hits", key: "compare" },
  { label: "Generating your report", key: "report" },
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

const Analyze = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
          navigate("/results", { state: { results: analysisData, title: title || file.name, goal, uploadedFile: file, songGenre: genre } });
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
        // Progress step markers based on poll count
        if (pollCount >= 2 && !completedSteps.includes(2)) markStep(2);

        try {
          const res = await fetch((import.meta.env.VITE_LAMBDA_URL || "https://u2yjblp3w5.execute-api.eu-west-1.amazonaws.com/prod/analyze"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "poll", jobId }),
          });
          const data = await res.json();

          if (data.status === "complete") {
            markStep(3);
            setTimeout(() => {
              setLoading(false);
              navigate("/results", { state: { results: data, title: title || file.name, goal, uploadedFile: file, songGenre: genre } });
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
          className="flex flex-col items-center gap-8 max-w-md w-full"
        >
          <div className="relative">
            <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-primary/20 blur-3xl" />
            <LoadingWaveform />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-heading text-white">
              Analyzing your song...
            </p>
            <p className="mt-2 text-sm text-muted-foreground tabular-nums">{elapsedSeconds}s</p>
          </div>

          {/* Step progress */}
          <div className="w-full space-y-3">
            {analysisSteps.map((step, i) => {
              const isCompleted = completedSteps.includes(i);
              const isCurrent = currentStep === i && !isCompleted;
              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                    isCompleted
                      ? "border-green-500/30 bg-green-500/10"
                      : isCurrent
                        ? "border-primary/30 bg-primary/10"
                        : "border-white/5 bg-white/[0.02] opacity-50"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
                    isCompleted
                      ? "bg-green-500"
                      : isCurrent
                        ? "bg-primary/30 border-2 border-primary"
                        : "bg-white/10"
                  )}>
                    {isCompleted ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
                        <Check className="h-4 w-4 text-white" />
                      </motion.div>
                    ) : isCurrent ? (
                      <motion.div
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">{i + 1}</span>
                    )}
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    isCompleted ? "text-green-400" : isCurrent ? "text-white" : "text-muted-foreground"
                  )}>
                    {step.label}
                    {isCompleted && " ✓"}
                    {isCurrent && "..."}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-24 pb-12 bg-[#0a0a0a]">
      <div className="container max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-black font-heading text-center mb-2 text-white">Analyze Your Song</h1>
          <p className="text-center text-muted-foreground mb-10">
            Upload your track and get your hit score in 60 seconds
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
                    <p className="font-bold text-xl text-white">Drop your song here</p>
                    <p className="text-sm text-muted-foreground mt-2">MP3 or WAV · max 100 MB</p>
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
