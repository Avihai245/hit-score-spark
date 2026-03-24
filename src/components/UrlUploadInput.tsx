import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, Loader2, X, CheckCircle } from "lucide-react";

interface UrlUploadInputProps {
  onUrlSubmit: (url: string, platform: string) => void;
  isLoading?: boolean;
}

const PLATFORM_PATTERNS = [
  { name: "YouTube", pattern: /youtube\.com|youtu\.be/, color: "#FF0000", icon: "▶" },
  { name: "Spotify", pattern: /open\.spotify\.com/, color: "#1DB954", icon: "🎧" },
  { name: "SoundCloud", pattern: /soundcloud\.com/, color: "#FF5500", icon: "☁" },
];

function detectPlatform(url: string) {
  for (const p of PLATFORM_PATTERNS) { if (p.pattern.test(url)) return p; }
  return null;
}

export default function UrlUploadInput({ onUrlSubmit, isLoading }: UrlUploadInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const platform = url ? detectPlatform(url) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!url.trim()) { setError("Please enter a URL"); return; }
    if (!platform) { setError("Only YouTube, Spotify, and SoundCloud URLs are supported"); return; }
    try { new URL(url); } catch { setError("Invalid URL format"); return; }
    onUrlSubmit(url.trim(), platform.name);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Link className="w-4 h-4 text-white/30" />
          {platform && (
            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: platform.color + "20", color: platform.color }}>
              {platform.icon} {platform.name}
            </motion.span>
          )}
        </div>
        <input type="url" value={url} onChange={(e) => { setUrl(e.target.value); setError(""); }}
          placeholder="Paste YouTube, Spotify, or SoundCloud URL..."
          className={`w-full pl-${platform ? "28" : "10"} pr-10 py-3 bg-white/5 border rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition-colors ${error ? "border-red-500/50" : platform ? "border-green-500/40" : "border-white/10 focus:border-purple-500/50"}`}
          disabled={isLoading} />
        {url && (
          <button type="button" onClick={() => { setUrl(""); setError(""); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-400">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      <button type="submit" disabled={!url || isLoading}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed border border-white/10">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        {isLoading ? "Fetching audio..." : "Analyze from URL"}
      </button>
      <p className="text-xs text-white/30 text-center">Audio is extracted via yt-dlp. Spotify links require track availability.</p>
    </form>
  );
}
