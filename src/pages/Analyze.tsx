import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Upload, Music, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const genres = ["Pop", "Hip Hop", "R&B", "Indie Pop", "Melodic House", "EDM", "Rock", "Latin", "Afrobeats", "Other"];
const goals = [
  { value: "playlists", label: "Get on Spotify playlists" },
  { value: "tiktok", label: "Go viral on TikTok" },
  { value: "label", label: "Impress a label" },
  { value: "streams", label: "Maximize streams" },
];

const LoadingBars = () => (
  <div className="flex items-end justify-center gap-2 h-20">
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

const loadingMessages = [
  "Getting upload URL...",
  "Uploading your song...",
  "Analyzing BPM & energy...",
  "Checking hook timing...",
  "Comparing to viral hits...",
  "Generating your roadmap...",
];

const Analyze = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [goal, setGoal] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const acceptFile = useCallback((f: File) => {
    const valid = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/wave"];
    if (!valid.includes(f.type) && !f.name.match(/\.(mp3|wav)$/i)) {
      toast({ title: "Invalid file", description: "Please upload an MP3 or WAV file.", variant: "destructive" });
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 50 MB.", variant: "destructive" });
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
    setLoadingStep(0);

    try {
      // Step 1 – Get presigned upload URL
      setLoadingStep(0);
      const urlRes = await fetch("https://hitcheck.vercel.app/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-upload-url", fileName: file.name }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, s3Key } = await urlRes.json();

      // Step 2 – Upload file directly to S3
      setLoadingStep(1);
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "audio/mpeg" },
      });
      if (!uploadRes.ok) throw new Error("File upload failed");

      // Step 3 – Analyze
      setLoadingStep(2);
      const stepInterval = setInterval(() => {
        setLoadingStep((prev) => Math.min(prev + 1, loadingMessages.length - 1));
      }, 3000);

      const analysisRes = await fetch("https://hitcheck.vercel.app/api/upload", {
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
      clearInterval(stepInterval);
      if (!analysisRes.ok) throw new Error("Analysis failed");
      const data = await analysisRes.json();
      navigate("/results", { state: { results: data, title: title || file.name, goal } });
    } catch {
      toast({ title: "Analysis failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-[#0a0a0a]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-8"
        >
          <div className="relative">
            <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-primary/20 blur-3xl" />
            <LoadingBars />
          </div>
          <div className="text-center">
            <motion.p
              key={loadingStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-semibold font-heading text-white"
            >
              {loadingMessages[loadingStep]}
            </motion.p>
            <p className="mt-2 text-sm text-muted-foreground">This may take up to 60 seconds</p>
          </div>
          <div className="flex gap-1.5">
            {loadingMessages.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-8 rounded-full transition-all duration-500",
                  i <= loadingStep ? "gradient-purple glow-purple" : "bg-white/10"
                )}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-24 pb-12">
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
                "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed min-h-[320px] transition-all",
                dragOver
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : file
                    ? "border-accent/40 bg-accent/5"
                    : "border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 bg-card/30"
              )}
            >
              {file ? (
                <div className="flex flex-col items-center gap-3 p-6">
                  <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                    <Music className="h-8 w-8 text-accent" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{file.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{formatSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 rounded-full border border-border px-3 py-1.5 transition-colors"
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">Drop your song here</p>
                    <p className="text-sm text-muted-foreground mt-1">MP3 or WAV · max 50 MB</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                  </div>
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
