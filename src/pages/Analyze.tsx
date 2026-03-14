import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Upload, Music, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const genres = ["Melodic House", "Indie Pop", "R&B", "Pop", "Hip Hop", "Other"];

const LoadingBars = () => (
  <div className="flex items-end justify-center gap-1 h-12">
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="w-2 rounded-full gradient-purple"
        style={{
          animation: `bar-bounce 0.8s ease-in-out ${i * 0.15}s infinite`,
          height: "100%",
          transformOrigin: "bottom",
        }}
      />
    ))}
  </div>
);

const Analyze = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
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
    try {
      // Step 1 – Get presigned upload URL
      const urlRes = await fetch("https://hitcheck.vercel.app/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-upload-url", fileName: file.name }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, s3Key } = await urlRes.json();

      // Step 2 – Upload file directly to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "audio/mpeg" },
      });
      if (!uploadRes.ok) throw new Error("File upload failed");

      // Step 3 – Analyze
      const analysisRes = await fetch("https://hitcheck.vercel.app/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          s3Key,
          title: title.trim() || undefined,
          genre: genre || undefined,
        }),
      });
      if (!analysisRes.ok) throw new Error("Analysis failed");
      const data = await analysisRes.json();
      navigate("/results", { state: { results: data, title: title || file.name } });
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

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-20 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-lg p-8"
      >
        {loading ? (
          <div className="flex flex-col items-center gap-6 py-12">
            <LoadingBars />
            <p className="text-muted-foreground font-medium">Analyzing your song...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h1 className="text-2xl font-bold">Analyze Your Song</h1>

            {/* Drop zone */}
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
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors",
                dragOver
                  ? "border-primary bg-primary/10"
                  : file
                    ? "border-accent/40 bg-accent/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
              )}
            >
              {file ? (
                <div className="flex items-center gap-3">
                  <Music className="h-8 w-8 text-accent" />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="ml-2 rounded-full p-1 hover:bg-secondary"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop your song here (MP3 or WAV)</p>
                  <p className="text-xs text-muted-foreground">or click to browse · max 50 MB</p>
                </>
              )}
            </div>

            {/* Optional fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Song Title <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input placeholder="My Song" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Genre <span className="text-muted-foreground">(optional)</span>
                </label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gradient-purple text-primary-foreground font-semibold glow-purple hover:opacity-90 transition-opacity"
            >
              Analyze Now →
            </Button>

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Your data is never stored or shared
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Analyze;
