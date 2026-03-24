import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Clock, TrendingUp, Scissors } from "lucide-react";

interface TikTokClip {
  start_sec?: number;
  end_sec?: number;
  duration_sec?: number;
  reason?: string;
  viral_potential?: number;
  hook_text?: string;
}

interface TikTokClipRecommenderProps {
  clip?: TikTokClip;
  totalDurationSec?: number;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TikTokClipRecommender({ clip, totalDurationSec = 210 }: TikTokClipRecommenderProps) {
  const [copied, setCopied] = useState(false);
  const startSec = clip?.start_sec ?? 30;
  const endSec = clip?.end_sec ?? 45;
  const duration = clip?.duration_sec ?? endSec - startSec;
  const viralPotential = clip?.viral_potential ?? 75;
  const reason = clip?.reason ?? "Peak energy section with strongest hook";
  const hookText = clip?.hook_text;
  const startPct = (startSec / totalDurationSec) * 100;
  const widthPct = ((endSec - startSec) / totalDurationSec) * 100;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Best TikTok clip: ${formatTime(startSec)} – ${formatTime(endSec)} (${duration}s)\n${reason}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#69C9D0]/30 bg-gradient-to-br from-[#69C9D0]/10 to-transparent p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#69C9D0]/20 flex items-center justify-center">
            <Scissors className="w-4 h-4 text-[#69C9D0]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">TikTok Clip Recommender</h3>
            <p className="text-xs text-white/50">Best 15-second window for maximum virality</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#69C9D0]/20 border border-[#69C9D0]/40">
          <TrendingUp className="w-3 h-3 text-[#69C9D0]" />
          <span className="text-xs font-bold text-[#69C9D0]">{viralPotential}% viral</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>0:00</span>
          <span>{formatTime(totalDurationSec)}</span>
        </div>
        <div className="relative h-8 bg-white/5 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center gap-0.5 px-1">
            {Array.from({ length: 80 }).map((_, i) => {
              const height = 20 + Math.sin(i * 0.8) * 10 + Math.random() * 20;
              const inClip = (i / 80) * 100 >= startPct && (i / 80) * 100 <= startPct + widthPct;
              return <div key={i} className={`flex-1 rounded-sm ${inClip ? "bg-[#69C9D0]" : "bg-white/20"}`} style={{ height: `${Math.min(100, height)}%` }} />;
            })}
          </div>
          <motion.div className="absolute top-0 bottom-0 border-2 border-[#69C9D0] rounded bg-[#69C9D0]/20"
            style={{ left: `${startPct}%`, width: `${widthPct}%` }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-xl bg-white/5">
          <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-1"><Play className="w-3 h-3" /> Start</div>
          <div className="text-lg font-bold text-white">{formatTime(startSec)}</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-white/5">
          <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-1"><Clock className="w-3 h-3" /> Duration</div>
          <div className="text-lg font-bold text-[#69C9D0]">{duration}s</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-white/5">
          <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-1"><TrendingUp className="w-3 h-3" /> End</div>
          <div className="text-lg font-bold text-white">{formatTime(endSec)}</div>
        </div>
      </div>
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <p className="text-xs text-white/60 font-medium uppercase tracking-wide mb-1">Why this section</p>
        <p className="text-sm text-white/80">{reason}</p>
        {hookText && <p className="mt-2 text-sm text-[#69C9D0] italic">"{hookText}"</p>}
      </div>
      <button onClick={handleCopy}
        className="w-full py-2.5 rounded-xl bg-[#69C9D0]/20 border border-[#69C9D0]/40 text-[#69C9D0] text-sm font-medium hover:bg-[#69C9D0]/30 transition-colors">
        {copied ? "✓ Copied!" : "📋 Copy clip recommendation"}
      </button>
    </motion.div>
  );
}
