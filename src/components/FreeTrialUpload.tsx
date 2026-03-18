import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Upload, Music, X, Zap, Lock, Gift, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const FREE_TRIAL_KEY = "santo_free_trial_used";

const genres = [
  "Pop", "Hip Hop", "R&B", "Indie Pop", "Melodic House",
  "EDM", "Rock", "Latin", "Afrobeats", "Other",
];
const goals = [
  { value: "playlists", label: "Get on Spotify playlists" },
  { value: "tiktok", label: "Go viral on TikTok" },
  { value: "label", label: "Impress a label" },
  { value: "streams", label: "Maximize streams" },
];

/* ─── Staggered reveal container ─── */
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const itemReveal = {
  hidden: { opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const cardReveal = {
  hidden: { opacity: 0, y: 60, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const, delay: 0.3 },
  },
};

/* ─── Glowing orb background ─── */
const GlowOrbs = () => (
  <>
    <motion.div
      className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-primary/10 blur-[120px]"
      animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
      transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-accent/8 blur-[140px]"
      animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
      transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
    />
  </>
);

export default function FreeTrialUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [goal, setGoal] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const alreadyUsed = localStorage.getItem(FREE_TRIAL_KEY) === "true";

  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const acceptFile = useCallback(
    (f: File) => {
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

      // 🎉 Confetti burst on successful file selection
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#8B5CF6", "#F59E0B", "#22C55E", "#3B82F6"],
      });
      toast({ title: "🎵 Track uploaded!", description: `${f.name} is ready to analyze.` });
    },
    [toast],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) acceptFile(f);
    },
    [acceptFile],
  );

  const handleSubmit = () => {
    if (!file) return;
    localStorage.setItem(FREE_TRIAL_KEY, "true");
    navigate("/analyze", {
      state: { prefill: { file, title, genre, goal, freeTrial: true } },
    });
  };

  /* Already used — show a compact "done" state */
  if (alreadyUsed) {
    return (
      <section ref={sectionRef} className="py-20 px-4 relative overflow-hidden border-t border-border/20">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container max-w-3xl relative">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-sm p-10 text-center"
          >
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              You've used your free analysis
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              Unlock unlimited analyses and AI-powered insights with a plan.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                className="gradient-purple text-primary-foreground font-bold rounded-full px-8"
              >
                <a href="/pricing">View Plans</a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full px-8"
              >
                <a href="/analyze">Analyze Another Track</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <section ref={sectionRef} className="py-24 px-4 relative overflow-hidden border-t border-border/20">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(258_90%_66%_/0.06),transparent)]" />
      <GlowOrbs />

      <motion.div
        className="container max-w-5xl relative"
        variants={container}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {/* Header */}
        <motion.div variants={itemReveal} className="text-center mb-5">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-xs font-bold text-accent uppercase tracking-wider">
            <Gift className="h-3 w-3" /> Free Trial
          </span>
        </motion.div>
        <motion.h2
          variants={itemReveal}
          className="text-center text-3xl md:text-5xl font-black font-heading mb-3 text-foreground"
        >
          Try It Now — <span className="gradient-text">100% Free</span>
        </motion.h2>
        <motion.p
          variants={itemReveal}
          className="text-center text-muted-foreground mb-12 max-w-xl mx-auto text-lg"
        >
          Upload your track and see your viral score instantly. One free analysis to experience the full power.
        </motion.p>

        {/* Upload card with dramatic reveal */}
        <motion.div
          variants={cardReveal}
          className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm p-6 md:p-8 relative overflow-hidden"
        >
          {/* Top accent line */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-[2px]"
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: "linear-gradient(90deg, transparent, hsl(258 90% 66%), hsl(38 92% 50%), transparent)" }}
          />

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left – Drop zone */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
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
                  "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed min-h-[260px] transition-all relative overflow-hidden group",
                  dragOver
                    ? "border-primary bg-primary/10 scale-[1.01]"
                    : file
                      ? "border-accent/40 bg-accent/5"
                      : "border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5",
                )}
              >
                {file ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex flex-col items-center gap-2 p-4 relative z-10"
                  >
                    <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                      <Music className="h-8 w-8 text-accent" />
                    </div>
                    <p className="font-bold text-foreground text-center">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1 rounded-full border border-border px-3 py-1 transition-colors"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  </motion.div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <motion.div
                      className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                      <Upload className="h-8 w-8 text-primary" />
                    </motion.div>
                    <div className="text-center">
                      <p className="font-bold text-foreground">Drop your track here</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        MP3 or WAV · max 100 MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Right – Fields + CTA */}
            <motion.div
              className="flex flex-col gap-4"
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                  Song Title <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Enter your song title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Genre</label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="h-11">
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
                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                  What's your goal?
                </label>
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {goals.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-auto">
                <Button
                  onClick={handleSubmit}
                  disabled={!file}
                  className="w-full h-13 gradient-purple text-primary-foreground text-base font-bold hover:opacity-90 transition-all disabled:opacity-40 gap-2 relative overflow-hidden rounded-xl shadow-[0_0_30px_-5px] shadow-primary/30"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  />
                  <Zap className="h-5 w-5 relative z-10" />
                  <span className="relative z-10">Analyze Free →</span>
                </Button>
              </motion.div>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3" /> Your song is never stored or shared · 1 free analysis
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
