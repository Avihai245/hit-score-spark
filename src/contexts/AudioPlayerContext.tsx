import { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from 'react';

export interface Track {
  id: string;
  title: string;
  audioUrl: string;
  imageUrl?: string;    // cover art from Suno
  sourceTitle?: string; // analysis title it came from
  analysisId?: string;
}

interface AudioPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number; // 0–100
  duration: number;
  currentTime: number;
  volume: number;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  seek: (pct: number) => void;
  setVolume: (v: number) => void;
  closePlayer: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const playTrack = useCallback((track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (currentTrack?.id === track.id) {
      if (isPlaying) { audio.pause(); setIsPlaying(false); }
      else { audio.play(); setIsPlaying(true); }
      return;
    }
    audio.src = track.audioUrl;
    audio.volume = volume;
    audio.play().then(() => setIsPlaying(true)).catch(console.warn);
    setCurrentTrack(track);
    setProgress(0);
    setCurrentTime(0);
  }, [currentTrack, isPlaying, volume]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play(); setIsPlaying(true); }
  }, [isPlaying, currentTrack]);

  const seek = useCallback((pct: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = (pct / 100) * audio.duration;
  }, []);

  const setVolume = useCallback((v: number) => {
    if (audioRef.current) audioRef.current.volume = v;
    setVolumeState(v);
  }, []);

  const closePlayer = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setCurrentTrack(null);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  return (
    <AudioPlayerContext.Provider value={{
      currentTrack, isPlaying, progress, duration, currentTime, volume,
      playTrack, togglePlay, seek, setVolume, closePlayer,
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  return ctx;
};
