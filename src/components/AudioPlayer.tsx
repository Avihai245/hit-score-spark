import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Download, Music, Disc3 } from 'lucide-react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

const formatTime = (s: number) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export const AudioPlayer = () => {
  const { currentTrack, isPlaying, progress, duration, currentTime, volume, togglePlay, seek, setVolume, closePlayer } = useAudioPlayer();
  const [showVolume, setShowVolume] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

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

  // Empty state for dashboard — always show the bar
  if (!currentTrack) {
    if (!isDashboard) return null;
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(var(--card))]/95 backdrop-blur-xl border-t border-border/30 px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center">
              <Disc3 className="h-4 w-4 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">No track playing</p>
              <p className="text-xs text-muted-foreground/50">Select a song from your library to start listening</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button disabled className="text-muted-foreground/20"><SkipBack className="h-4 w-4" /></button>
            <button disabled className="w-9 h-9 rounded-full bg-muted/30 flex items-center justify-center">
              <Play className="h-4 w-4 text-muted-foreground/30 ml-0.5" />
            </button>
            <button disabled className="text-muted-foreground/20"><SkipForward className="h-4 w-4" /></button>
          </div>
          <div className="flex-1" />
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(var(--card))]/95 backdrop-blur-xl border-t border-border/30 px-4 py-3"
        >
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            {/* Track info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 border border-border/30 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {isPlaying && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  />
                )}
                <Music className="h-4 w-4 text-primary relative z-10" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{currentTrack.title}</p>
                {currentTrack.sourceTitle && (
                  <p className="text-xs text-muted-foreground truncate">{currentTrack.sourceTitle}</p>
                )}
              </div>
            </div>

            {/* Controls + seek */}
            <div className="flex flex-col items-center gap-1.5 flex-1 max-w-md">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => seek(Math.max(0, progress - 5))}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <SkipBack className="h-4 w-4" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => seek(Math.min(100, progress + 5))}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>

              {/* Seek bar */}
              <div className="w-full flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{formatTime(currentTime)}</span>
                <div className="flex-1 relative group">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none bg-secondary cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
                      [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100
                      [&::-webkit-slider-runnable-track]:rounded-full"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${progress}%, hsl(var(--secondary)) ${progress}%, hsl(var(--secondary)) 100%)`
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums w-8">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Volume */}
              <div className="relative">
                <button
                  onClick={() => setShowVolume(!showVolume)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                {showVolume && (
                  <div className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-xl p-3 w-32">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full h-1 rounded-full appearance-none bg-secondary cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                      style={{
                        background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${volume * 100}%, hsl(var(--secondary)) ${volume * 100}%, hsl(var(--secondary)) 100%)`
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Download */}
              <button
                onClick={handleDownload}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                title="Download MP3"
              >
                <Download className="h-4 w-4" />
              </button>

              {/* Close */}
              <button
                onClick={closePlayer}
                className="text-muted-foreground/50 hover:text-foreground transition-colors p-1"
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
