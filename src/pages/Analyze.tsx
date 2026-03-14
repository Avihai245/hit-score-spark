import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Link as LinkIcon, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const genres = ["Melodic House", "Indie Pop", "R&B", "Pop", "Hip Hop", "Other"];

type Mode = "suno" | "lyrics";

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
  const [mode, setMode] = useState<Mode>("suno");
  const [sunoUrl, setSunoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [bpm, setBpm] = useState("");
  const [lyrics, setLyrics] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "suno" && !sunoUrl.trim()) {
      toast({ title: "Missing URL", description: "Please paste a Suno link.", variant: "destructive" });
      return;
    }
    if (mode === "lyrics" && !lyrics.trim()) {
      toast({ title: "Missing lyrics", description: "Please paste your lyrics.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let url: string;
      let body: Record<string, unknown>;

      if (mode === "suno") {
        url = "https://hitcheck.vercel.app/api/analyze-audio";
        body = { sunoUrl: sunoUrl.trim(), title: title.trim() || undefined, genre: genre || undefined };
      } else {
        url = "https://hitcheck.vercel.app/api/analyze";
        body = {
          title: title.trim() || undefined,
          genre: genre || undefined,
          bpm: bpm ? Number(bpm) : undefined,
          lyrics: lyrics.trim(),
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      navigate("/results", { state: { results: data, title: title || "Your Song" } });
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

            {/* Mode toggle */}
            <div className="flex gap-2 rounded-lg bg-secondary p-1">
              <button
                type="button"
                onClick={() => setMode("suno")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  mode === "suno" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LinkIcon className="h-4 w-4" /> Suno URL
              </button>
              <button
                type="button"
                onClick={() => setMode("lyrics")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  mode === "lyrics" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="h-4 w-4" /> Lyrics
              </button>
            </div>

            {/* Suno URL input */}
            {mode === "suno" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Suno Link</label>
                <Input
                  placeholder="https://suno.com/song/..."
                  value={sunoUrl}
                  onChange={(e) => setSunoUrl(e.target.value)}
                />
              </div>
            )}

            {/* Lyrics input */}
            {mode === "lyrics" && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Lyrics</label>
                  <Textarea
                    placeholder="Paste your full lyrics here..."
                    className="min-h-[160px]"
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    BPM <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 120"
                    value={bpm}
                    onChange={(e) => setBpm(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Shared optional fields */}
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
