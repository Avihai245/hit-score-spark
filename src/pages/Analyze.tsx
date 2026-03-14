import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [form, setForm] = useState({ title: "", genre: "", bpm: "", lyrics: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.genre || !form.lyrics) {
      toast({ title: "Missing fields", description: "Please fill in title, genre, and lyrics.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("https://hitcheck-api.vercel.app/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          genre: form.genre,
          bpm: form.bpm ? Number(form.bpm) : undefined,
          lyrics: form.lyrics,
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      navigate("/results", { state: { results: data, title: form.title } });
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

            <div>
              <label className="mb-1.5 block text-sm font-medium">Song Title</label>
              <Input
                placeholder="Enter your song title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Genre</label>
              <Select value={form.genre} onValueChange={(v) => setForm({ ...form, genre: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">BPM <span className="text-muted-foreground">(optional)</span></label>
              <Input
                type="number"
                placeholder="e.g. 120"
                value={form.bpm}
                onChange={(e) => setForm({ ...form, bpm: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Lyrics</label>
              <Textarea
                placeholder="Paste your full lyrics here..."
                className="min-h-[160px]"
                value={form.lyrics}
                onChange={(e) => setForm({ ...form, lyrics: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full gradient-purple text-primary-foreground font-semibold glow-purple hover:opacity-90 transition-opacity">
              Analyze Now →
            </Button>

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Your lyrics are never stored or shared
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Analyze;
