import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Download, RefreshCw, Volume2 } from "lucide-react";

interface SideBySidePlayerProps {
  originalUrl?: string;
  originalTitle?: string;
  generatedUrl?: string;
  generatedTitle?: string;
  onRegenerate?: (editedPrompt: string) => void;
  sunoPrompt?: string;
  isGenerating?: boolean;
}

function AudioTrack({ url, title, label, accentColor, isGenerating = false }: {
  url?: string; title?: string; label: string; accentColor: string; isGenerating?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress((audio.currentTime / audio.duration) * 100 || 0);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => { audio.removeEventListener("timeupdate", onTime); audio.removeEventListener("loadedmetadata", onLoaded); audio.removeEventListener("ended", onEnded); };
  }, [url]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !url) return;
    if (isPlaying) { audio.pause(); } else { audio.play(); }
    setIsPlaying(!isPlaying);
  };

  const fmt = (sec: number) => `${Math.floor(sec/60)}:${Math.floor(sec%60).toString().padStart(2,"0")}`;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !url) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  };

  return (
    <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      {url && <audio ref={audioRef} src={url} preload="metadata" />}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
        <span className="text-xs font-medium text-white/50 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-semibold text-white truncate">{title ?? (isGenerating ? "Generating..." : "No audio")}</p>
      <div className="flex items-center gap-3">
        <button onClick={togglePlay} disabled={!url || isGenerating}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: accentColor + "33", border: `1.5px solid ${accentColor}66` }}>
          {isGenerating ? (
            <motion.div className="w-4 h-4 rounded-full border-2 border-t-transparent" style={{ borderColor: accentColor }}
              animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          ) : isPlaying ? <Pause className="w-4 h-4" style={{ color: accentColor }} /> : <Play className="w-4 h-4" style={{ color: accentColor }} />}
        </button>
        <div className="flex-1 space-y-1">
          <div className="h-1.5 rounded-full bg-white/10 cursor-pointer overflow-hidden" onClick={handleSeek}>
            <motion.div className="h-full rounded-full" style={{ backgroundColor: accentColor, width: `${progress}%` }} transition={{ duration: 0.1 }} />
          </div>
          <div className="flex justify-between text-xs text-white/30">
            <span>{fmt((progress / 100) * duration)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
        <Volume2 className="w-4 h-4 text-white/30 hidden sm:block" />
      </div>
      {url && !isGenerating && (
        <a href={url} download={title ?? "track.mp3"}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border text-xs font-medium transition-colors hover:bg-white/10"
          style={{ borderColor: accentColor + "40", color: accentColor }}>
          <Download className="w-3 h-3" /> Download
        </a>
      )}
    </div>
  );
}

export default function SideBySidePlayer({ originalUrl, originalTitle, generatedUrl, generatedTitle, onRegenerate, sunoPrompt = "", isGenerating = false }: SideBySidePlayerProps) {
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(sunoPrompt);

  useEffect(() => { setEditedPrompt(sunoPrompt); }, [sunoPrompt]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <AudioTrack url={originalUrl} title={originalTitle ?? "Original Track"} label="Original" accentColor="#8B5CF6" />
        <AudioTrack url={generatedUrl} title={generatedTitle ?? "AI Remix"} label="AI Remix" accentColor="#EC4899" isGenerating={isGenerating && !generatedUrl} />
      </div>
      {onRegenerate && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Regenerate with Tweaks</h4>
            <button onClick={() => setShowPromptEditor(!showPromptEditor)} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
              {showPromptEditor ? "Hide editor" : "Edit prompt →"}
            </button>
          </div>
          {showPromptEditor && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
              <textarea value={editedPrompt} onChange={(e) => setEditedPrompt(e.target.value)}
                className="w-full h-24 bg-black/30 border border-white/20 rounded-lg p-3 text-sm text-white/80 placeholder-white/30 resize-none focus:outline-none focus:border-purple-500"
                placeholder="Edit the Suno prompt before regenerating..." />
              <p className="text-xs text-white/30">Modify the prompt to tweak genre, mood, instruments, or style</p>
            </motion.div>
          )}
          <button onClick={() => onRegenerate(editedPrompt)} disabled={isGenerating}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
            <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generating..." : "Regenerate with tweaks"}
          </button>
        </div>
      )}
    </div>
  );
}
