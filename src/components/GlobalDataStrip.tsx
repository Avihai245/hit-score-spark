import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const platforms = [
  { name: "Spotify", color: "#1DB954" },
  { name: "Apple Music", color: "#FC3C44" },
  { name: "TikTok", color: "#ffffff" },
  { name: "YouTube", color: "#FF0000" },
  { name: "Charts", color: "hsl(258 90% 66%)" },
];

const GlobalDataStrip = () => {
  const [lastSync, setLastSync] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastSync((prev) => (prev >= 45 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-8 bg-background/90 backdrop-blur-md border-b border-border/30 flex items-center justify-center gap-6 px-4 overflow-hidden">
      {/* Left: Powered by */}
      <span className="text-[10px] text-muted-foreground font-medium tracking-wide hidden sm:inline">
        Powered by Global Music Intelligence
      </span>

      {/* Separator */}
      <span className="hidden sm:inline text-border">|</span>

      {/* Platform names */}
      <div className="flex items-center gap-3">
        {platforms.map((p) => (
          <span
            key={p.name}
            className="text-[10px] font-medium tracking-wide opacity-50 hover:opacity-80 transition-opacity"
            style={{ color: p.color }}
          >
            {p.name}
          </span>
        ))}
      </div>

      {/* Separator */}
      <span className="hidden md:inline text-border">|</span>

      {/* Live system indicator */}
      <div className="hidden md:flex items-center gap-1.5">
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-emerald-400"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
        <span className="text-[10px] text-emerald-400/80 font-medium">System Active</span>
        <span className="text-[10px] text-muted-foreground/50 ml-1">
          · Last sync: {lastSync}s ago
        </span>
      </div>
    </div>
  );
};

export default GlobalDataStrip;
