import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Upload, Music, X, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const genres = ["Melodic House", "Indie Pop", "R&B", "Pop", "Hip Hop", "Other"];
const ACCEPTED = ".mp3,.wav,.m4a,.ogg,.flac";

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
  const [sunoUrl, setSunoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleFile = (f: File) => {
    if (f.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 50MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    setSunoUrl("");
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !sunoUrl.trim()) {
      toast({ title: "No audio provided", description: "Upload a file or paste a Suno link.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (sunoUrl.trim()) formData.append("sunoUrl", sunoUrl.trim());
      if (title.trim()) formData.append("title", title.trim());
      if (genre) formData.append("genre", genre);

      const res = await fetch("https://hitcheck.vercel.app/api/analyze", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      navigate("/results", { state: { results: data, title: title || file?.name || "Your Song" } });
    } catch {
      toast({ title: "Analysis failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => document.getElementById("file-input")?.click()}
              className={cn(
                "relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors",
                dragging
                  ? "border-primary bg-primary/5"
                  : file
                    ? "border-primary/40 bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
              )}
            >
              {file ? (
                <>
                  <Music className="h-10 w-10 text-primary" />
                  <div className="text-center">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="absolute top-3 right-3 rounded-full p-1 hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium">Drop your audio file here</p>
                    <p className="text-sm text-muted-foreground">or click to browse · MP3, WAV, M4A, FLAC</p>
                  </div>
                </>
              )}
              <input
                id="file-input"
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>

            {/* Suno URL */}
            {!file && (
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <label className="text-sm font-medium">Or paste your Suno URL</label>
                </div>
                <Input
                  placeholder="https://suno.com/song/..."
                  value={sunoUrl}
                  onChange={(e) => setSunoUrl(e.target.value)}
                />
              </div>
            )}

            {/* Optional fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Song Title <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  placeholder="My Song"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
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
              <Lock className="h-3 w-3" /> Your audio is never stored or shared
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Analyze;
