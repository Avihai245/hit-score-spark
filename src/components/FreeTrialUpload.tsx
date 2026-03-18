import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { delay, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
});

export default function FreeTrialUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [goal, setGoal] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const alreadyUsed = localStorage.getItem(FREE_TRIAL_KEY) === "true";

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
    // Mark trial as used
    localStorage.setItem(FREE_TRIAL_KEY, "true");
    // Navigate to /analyze with pre-filled state
    navigate("/analyze", {
      state: { prefill: { file, title, genre, goal, freeTrial: true } },
    });
  };

  /* Already used — show a compact "done" state */
  if (alreadyUsed) {
    return (
      <section className="py-20 px-4 relative overflow-hidden border-t border-border/20">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container max-w-3xl relative">
          <motion.div
            {...fadeUp()}
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
    <section className="py-24 px-4 relative overflow-hidden border-t border-border/20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(258_90%_66%_/0.06),transparent)]" />

      <div className="container max-w-5xl relative">
        {/* Header */}
        <motion.div {...fadeUp()} className="text-center mb-5">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-xs font-bold text-accent uppercase tracking-wider">
            <Gift className="h-3 w-3" /> Free Trial
          </span>
        </motion.div>
        <motion.h2
          {...fadeUp(0.05)}
          className="text-center text-3xl md:text-5xl font-black font-heading mb-3 text-foreground"
        >
          Try It Now — <span className="gradient-text">100% Free</span>
        </motion.h2>
        <motion.p
          {...fadeUp(0.08)}
          className="text-center text-muted-foreground mb-12 max-w-xl mx-auto text-lg"
        >
          Upload your track and see your viral score instantly. One free analysis to experience the full power.
        </motion.p>

        {/* Upload card */}
        <motion.div
          {...fadeUp(0.12)}
          className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm p-6 md:p-8"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left – Drop zone */}
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
                <div className="flex flex-col items-center gap-2 p-4 relative z-10">
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
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-foreground">Drop your track here</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MP3 or WAV · max 100 MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right – Fields + CTA */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                  Song Title <span className="text-muted-foreground font-normal">(optional)</span>
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
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
