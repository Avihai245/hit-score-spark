import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Download, Music } from 'lucide-react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';

const formatTime = (s: number) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export const AudioPlayer = () => {
  const { currentTrack, isPlaying, progress, duration, currentTime, volume, togglePlay, seek, setVolume, closePlayer } = useAudioPlayer();
  const [showVolume, setShowVolume] = useState(false);

  const handleDownload = async () => {
    if (!currentTrack?.audioUrl) return;
    try {
      const res = await fetch(currentTrack.audioUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentTrack.title || 'remix'}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(currentTrack.audioUrl, '_blank');
    }
  };

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111]/95 backdrop-blur-xl border-t border-white/10 px-4 py-3"
        >
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            {/* Track info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-yellow-500/30 border border-white/10 flex-shrink-0 flex items-center justify-center">
                <Music className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{currentTrack.title}</p>
                {currentTrack.sourceTitle && (
                  <p className="text-xs text-white/40 truncate">{currentTrack.sourceTitle}</p>
                )}
              </div>
            </div>

            {/* Controls + seek */}
            <div className="flex flex-col items-center gap-1.5 flex-1 max-w-md">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => seek(Math.max(0, progress - 5))}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <SkipBack className="h-4 w-4" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 text-black" />
                  ) : (
                    <Play className="h-4 w-4 text-black ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => seek(Math.min(100, progress + 5))}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>

              {/* Seek bar */}
              <div className="w-full flex items-center gap-2">
                <span className="text-[10px] text-white/40 tabular-nums w-8 text-right">{formatTime(currentTime)}</span>
                <div className="flex-1 relative group">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none bg-white/20 cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                      [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100
                      [&::-webkit-slider-runnable-track]:rounded-full"
                    style={{
                      background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${progress}%, rgba(255,255,255,0.2) ${progress}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                </div>
                <span className="text-[10px] text-white/40 tabular-nums w-8">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Volume */}
              <div className="relative">
                <button
                  onClick={() => setShowVolume(!showVolume)}
                  className="text-white/50 hover:text-white transition-colors p-1"
                >
                  {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                {showVolume && (
                  <div className="absolute bottom-full right-0 mb-2 bg-[#1a1a1a] border border-white/10 rounded-xl p-3 w-32">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full h-1 rounded-full appearance-none bg-white/20 cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                      style={{
                        background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Download */}
              <button
                onClick={handleDownload}
                className="text-white/50 hover:text-white transition-colors p-1"
                title="Download MP3"
              >
                <Download className="h-4 w-4" />
              </button>

              {/* Close */}
              <button
                onClick={closePlayer}
                className="text-white/30 hover:text-white transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AudioPlayer;
