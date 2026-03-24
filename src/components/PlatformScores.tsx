import { motion } from "framer-motion";

interface PlatformScoresProps {
  scores: {
    tiktok?: number;
    spotify?: number;
    youtube?: number;
    apple?: number;
  };
}

const PLATFORMS = [
  { key: "tiktok", label: "TikTok", color: "#69C9D0", icon: "🎵", description: "Virality potential" },
  { key: "spotify", label: "Spotify", color: "#1DB954", icon: "🎧", description: "Playlist fit" },
  { key: "youtube", label: "YouTube", color: "#FF0000", icon: "▶", description: "Watch & share rate" },
  { key: "apple", label: "Apple Music", color: "#FA243C", icon: "🎵", description: "Editorial potential" },
] as const;

function MiniGauge({ score, color, size = 80 }: { score: number; color: string; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={6} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

export default function PlatformScores({ scores }: PlatformScoresProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {PLATFORMS.map(({ key, label, color, icon, description }) => {
        const score = scores[key] ?? 0;
        const rounded = Math.round(score);
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: PLATFORMS.findIndex(p => p.key === key) * 0.1 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className="relative">
              <MiniGauge score={rounded} color={color} size={76} />
              <div className="absolute inset-0 flex items-center justify-center rotate-90">
                <span className="text-lg font-bold text-white">{rounded}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-white flex items-center gap-1 justify-center">
                <span>{icon}</span> {label}
              </div>
              <div className="text-xs text-white/50 mt-0.5">{description}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
