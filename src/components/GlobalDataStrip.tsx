import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const platforms = [
  { name: "Spotify", color: "#1DB954" },
  { name: "Apple Music", color: "#FC3C44" },
  { name: "TikTok", color: "#ffffff" },
  { name: "YouTube", color: "#FF0000" },
  { name: "Charts", color: "hsl(258 90% 66%)" },
];

const GlobalDataStrip = () => {
  const [trackCount, setTrackCount] = useState<number | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const fetchSyncStatus = async () => {
      // Get real data from viral_dna_cache
      const { data, error } = await supabase
        .from("viral_dna_cache")
        .select("track_count, updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setIsLive(true);
        const total = data.track_count as number | null;
        if (total) setTrackCount(total);
        if (data.updated_at) {
          const diff = Math.floor((Date.now() - new Date(data.updated_at).getTime()) / 1000 / 60);
          if (diff < 60) setLastSync(`${diff}m ago`);
          else if (diff < 1440) setLastSync(`${Math.floor(diff / 60)}h ago`);
          else setLastSync(`${Math.floor(diff / 1440)}d ago`);
        }
      } else {
        // No real data yet — show neutral status
        setIsLive(false);
        setLastSync(null);
      }
    };

    fetchSyncStatus();
    // Refresh every 5 minutes
    const interval = setInterval(fetchSyncStatus, 300_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-8 bg-background/90 backdrop-blur-md border-b border-border/30 flex items-center justify-center gap-6 px-4 overflow-hidden">
      {/* Left: Powered by */}
      <span className="text-[10px] text-muted-foreground font-medium tracking-wide hidden sm:inline">
        Powered by Global Music Intelligence
      </span>

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

      <span className="hidden md:inline text-border">|</span>

      {/* Live system indicator — real data */}
      <div className="hidden md:flex items-center gap-1.5">
        <motion.div
          className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-400" : "bg-amber-400"}`}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
        {isLive ? (
          <>
            <span className="text-[10px] text-emerald-400/80 font-medium">
              {trackCount ? `${trackCount.toLocaleString()} Hits Indexed` : "Live"}
            </span>
            {lastSync && (
              <span className="text-[10px] text-muted-foreground/50 ml-1">
                · Synced {lastSync}
              </span>
            )}
          </>
        ) : (
          <span className="text-[10px] text-amber-400/80 font-medium">Syncing Charts…</span>
        )}
      </div>
    </div>
  );
};

export default GlobalDataStrip;
