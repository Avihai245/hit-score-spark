/**
 * HitCheck â Main Workspace
 *
 * 3-panel workspace layout:
 *   LEFT  (280px) â Audio upload Â· Lyrics editor Â· Style tags Â· Create button
 *   CENTER (flex) â Song feed with Liked/All/Uploads tabs + inline actions
 *   RIGHT  (300px) â Active song detail: lyrics Â· style Â· waveform Â· actions
 *   BOTTOM â Full sticky player: progress Â· like Â· download Â· share
 *
 * No full-page navigation for tab switches.
 * Likes stored in localStorage (instant, no schema migration).
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { supabase, supabaseUrl, supabaseAnonKey, PLAN_LIMITS, CREDIT_COSTS, deductCredits } from '@/lib/supabase';
import { saveRemixesToLocalStorage } from '@/lib/remixStorage';
import { createCheckoutSession, PRICES } from '@/lib/stripe';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Search, Music2, Rocket, Play, Pause, Sparkles, Upload, Mic2, X,
  Loader2, AlertTriangle, Download, ArrowRight, Crown, Lock,
  BarChart2, Headphones, CheckCircle2, Heart, Share2, MoreHorizontal,
  ChevronDown, ChevronRight, RotateCcw, Bookmark, Eye, TrendingUp,
  Flame, Target, FileText, Volume2, Shuffle, SkipBack, SkipForward,
  Repeat, Copy, Check, Globe, GitBranch, CreditCard, Zap,
} from 'lucide-react';

const LAMBDA_URL = import.meta.env.VITE_LAMBDA_URL || 'https://u2yjblp3w5.execute-api.eu-west-1.amazonaws.com/prod/analyze';
const SUPABASE_URL = supabaseUrl;
const SUPABASE_ANON = supabaseAnonKey;

const GENERATION_KEY = (uid: string) => `hitcheck_generating_${uid}`;
const LYRICS_KEY = (taskId: string) => `hitcheck_lyrics_${taskId}`;
const saveLyricsForTrack = (taskId: string, lyrics: string) => {
  try { localStorage.setItem(LYRICS_KEY(taskId), lyrics); } catch {}
};
const loadLyricsForTrack = (taskId: string): string => {
  try { return localStorage.getItem(LYRICS_KEY(taskId)) || ''; } catch { return ''; }
};

interface PendingGeneration {
  taskIdV1: string;
  taskIdV2: string;
  version1Label: string;
  version2Label: string;
  title: string;
  genre: string;
  analysisId: string | null;
  startedAt: number;
}

const savePendingGeneration = (uid: string, gen: PendingGeneration) => {
  try { localStorage.setItem(GENERATION_KEY(uid), JSON.stringify(gen)); } catch {}
};

const loadPendingGeneration = (uid: string): PendingGeneration | null => {
  try {
    const raw = localStorage.getItem(GENERATION_KEY(uid));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const clearPendingGeneration = (uid: string) => {
  try { localStorage.removeItem(GENERATION_KEY(uid)); } catch {}
};

/** Extract S3 key from a public S3 URL (amazonaws.com/.../key) */
const extractS3Key = (url: string): string | null => {
  if (!url) return null;
  try {
    const match = url.match(/amazonaws\.com\/(.+?)(\?|$)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch { return null; }
};

/* âââ Types âââ */
interface Analysis {
  id: string; title: string; genre: string; score: number;
  created_at: string; audio_url?: string; thumbnail_url?: string;
  full_result?: any; verdict?: string;
}
interface Remix {
  id: string; remix_title?: string; title?: string;
  audio_url: string; image_url?: string; created_at: string;
  analysis_id?: string; genre?: string;
}
type SongItem = { type: 'analysis'; data: Analysis } | { type: 'remix'; data: Remix };
type CenterTab = 'all' | 'liked' | 'uploads' | 'created';

/* âââ LocalStorage play counts âââ */
const getPlayCounts = (uid: string): Record<string, number> => {
  try { return JSON.parse(localStorage.getItem(`hitcheck_plays_${uid}`) || '{}'); } catch { return {}; }
};
const incrementPlayCount = (uid: string, id: string) => {
  try {
    const counts = getPlayCounts(uid);
    counts[id] = (counts[id] || 0) + 1;
    localStorage.setItem(`hitcheck_plays_${uid}`, JSON.stringify(counts));
  } catch {}
};

/* âââ LocalStorage likes âââ */
const getLikes = (userId: string): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(`likes_${userId}`) || '[]')); }
  catch { return new Set(); }
};
const toggleLike = (userId: string, id: string): boolean => {
  const likes = getLikes(userId);
  if (likes.has(id)) { likes.delete(id); } else { likes.add(id); }
  localStorage.setItem(`likes_${userId}`, JSON.stringify([...likes]));
  return likes.has(id);
};

/* âââ Helpers âââ */
const getTitle = (item: SongItem): string =>
  item.type === 'analysis'
    ? (item.data.title || 'ðµ Scanned Track')
    : (item.data.remix_title || (item.data as any).original_title || 'â¡ Algorithm Hit');

const getStyleTags = (item: SongItem): string => {
  if (item.type === 'remix') return item.data.genre || '';
  const r = item.data.full_result;
  if (!r) return item.data.genre || '';
  const parts: string[] = [];
  if (r.bpmEstimate) parts.push(r.bpmEstimate);
  if (r.musicalKey) parts.push(r.musicalKey);
  if (item.data.genre) parts.push(item.data.genre);
  if (r.dominantInstrument) parts.push(r.dominantInstrument);
  if (r.drumPattern) parts.push(r.drumPattern.split(',')[0]);
  if (r.productionEra) parts.push(r.productionEra);
  return parts.filter(Boolean).join(', ');
};

const artGradient = (id: string) => {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const g = ['from-violet-600 to-indigo-500','from-rose-500 to-pink-400','from-emerald-500 to-cyan-400',
    'from-amber-500 to-orange-400','from-cyan-500 to-blue-500','from-purple-600 to-pink-500',
    'from-lime-500 to-emerald-400','from-sky-500 to-indigo-400'];
  return g[h % g.length];
};

const fmtDate = (d: string) => {
  const dt = new Date(d); const diff = Date.now() - dt.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today'; if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const fmtTime = (s: number) => {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

const STYLE_SUGGESTIONS = [
  'pop', 'hip hop', 'r&b', 'afrobeats', 'indie', 'electronic',
  'dark', 'emotional', 'danceable', 'energetic', 'melodic', 'chill',
  'rock dance', 'cool chord progression', 'trap', 'lo-fi', 'dreamy',
];

const VIRAL_STYLE_CHIPS = [
  'viral hook at 0:20', 'TikTok ready', 'stadium chorus',
  'dark trap', 'melodic pop', 'upbeat energy', 'emotional build',
  'indie aesthetic', 'R&B smooth', 'hip-hop flow', 'EDM drop',
  'acoustic raw', 'synth-pop', 'drill beat', 'afrobeats',
  'latin rhythm', 'country crossover', 'cinematic score',
];

const shuffleArray = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* âââ Waveform âââ */
/* âââ Built-in Workspace Player (no overlap ever) âââ */
/* âââ Scan steps with platform data âââ */
const SCAN_STEPS = [
  { at: 0,  icon: 'ðµ', platform: null,       label: 'Uploading & reading audio file',              color: 'text-muted-foreground' },
  { at: 6,  icon: 'ð¢', platform: 'Spotify',  label: 'Scanning Spotify hit patterns & playlist data', color: 'text-emerald-400' },
  { at: 16, icon: 'ð', platform: 'Apple',    label: 'Analyzing Apple Music chart performance',       color: 'text-pink-400' },
  { at: 26, icon: 'ð±', platform: 'TikTok',   label: 'Cross-referencing TikTok viral sound trends',   color: 'text-white' },
  { at: 36, icon: 'â¶ï¸', platform: 'YouTube',  label: 'Mapping YouTube Music recommendation signals',  color: 'text-red-400' },
  { at: 48, icon: 'ðï¸', platform: null,       label: 'Extracting BPM, key & hook timing',            color: 'text-primary' },
  { at: 58, icon: 'ð§¬', platform: null,       label: 'Benchmarking against 500K+ global hits',        color: 'text-accent' },
  { at: 70, icon: 'ð', platform: null,       label: 'Scoring viral coefficient & save-rate',          color: 'text-foreground' },
  { at: 82, icon: 'âï¸', platform: null,       label: 'Generating your personalized hit report',        color: 'text-primary' },
];

const LIVE_FEED = [
  'Connecting to Spotify catalog APIâ¦',
  'Pulling global playlist chart dataâ¦',
  'Extracting BPM & tempo signatureâ¦',
  'Scanning Apple Music editorial trendsâ¦',
  'Loading TikTok viral sound fingerprintsâ¦',
  'Comparing hook timing across 847 hitsâ¦',
  'Measuring danceability & energy indexâ¦',
  'Checking algorithmic playlist fit scoreâ¦',
  'Analyzing save-rate prediction modelâ¦',
  'Cross-referencing YouTube trending dataâ¦',
  'Mapping frequency spectrum to hit profilesâ¦',
  'Evaluating skip risk at 0:03, 0:15, 0:30â¦',
  'Computing replay potential scoreâ¦',
  'Matching against editorial playlist DNAâ¦',
  'Scoring viral coefficient across platformsâ¦',
  'Building your personalized hit blueprintâ¦',
];

/* âââ Viral Creation â cinematic injection pipeline âââ */
const VIRAL_STAGES = [
  {
    at: 0, platform: 'Spotify', color: '#1DB954',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1DB954">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    ),
    action: 'Scanning Spotify hit patterns',
    detail: 'Analyzing top 200 chart DNA',
    inject: 'Hook position optimized to :20',
  },
  {
    at: 12, platform: 'Apple Music', color: '#FC3C44',
    icon: (
      <svg viewBox="0 0 361 361" className="w-4 h-4">
        <rect width="361" height="361" rx="80" fill="#FC3C44"/>
        <path d="M255 96.5v131.3c0 15.1-10.4 28.2-25.1 32.1-5.3 1.4-10.9 1.7-16.3.9-14.6-2.2-25.1-14-25.1-28.2 0-15.8 13.6-28.5 30.4-28.5 5.5 0 10.7 1.3 15.2 3.7V137l-96 22.5v108.3c0 15.1-10.4 28.2-25.1 32.1-5.3 1.4-10.9 1.7-16.3.9-14.6-2.2-25.1-14-25.1-28.2 0-15.8 13.6-28.5 30.4-28.5 5.5 0 10.7 1.3 15.2 3.7V128.5c0-8.5 5.8-15.9 14-18l91.8-21.5c11.5-2.7 21.9 5.7 21.9 17.3v-9.8z" fill="#fff"/>
      </svg>
    ),
    action: 'Cross-referencing Apple Music charts',
    detail: 'Extracting editorial playlist criteria',
    inject: 'Key signature matched to chart winners',
  },
  {
    at: 24, platform: 'Deezer', color: '#FF0092',
    icon: <span className="text-[10px] font-black" style={{ color: '#FF0092' }}>dz</span>,
    action: 'Fetching Deezer live genre DNA',
    detail: `Loading viral ${'{'}genre{'}'} BPM & structure`,
    inject: 'BPM calibrated to genre sweet spot',
  },
  {
    at: 36, platform: 'YouTube', color: '#FF0000',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    action: 'Mapping YouTube trending signals',
    detail: 'Identifying retention & skip patterns',
    inject: 'Skip-risk moments identified & patched',
  },
  {
    at: 50, platform: null, color: 'hsl(270 91% 65%)',
    icon: <Sparkles className="w-4 h-4 text-primary" />,
    action: 'Injecting hit artist DNA',
    detail: 'Applying patterns from viral reference tracks',
    inject: 'Production elements from top artists loaded',
  },
  {
    at: 62, platform: null, color: 'hsl(38 92% 50%)',
    icon: <Music2 className="w-4 h-4 text-accent" />,
    action: 'Assembling AI Hit prompt',
    detail: 'Building optimized style + lyrics payload',
    inject: 'All viral parameters injected into AI engine',
  },
  {
    at: 76, platform: null, color: '#1DB954',
    icon: <Check className="w-4 h-4 text-emerald-400" />,
    action: 'HitCheck AI generating your song',
    detail: 'AI engine is rendering 2 tracks (~90 seconds)',
    inject: 'Final mix & mastering in progress',
  },
];

const INJECT_FEED = [
  'â¸ Spotify API â loading chart DNA for genreâ¦',
  'â¸ Hook position: benchmarked against 500K+ viral tracks',
  'â¸ Apple Music â editorial playlist criteria matched',
  'â¸ BPM calibrated: genre sweet spot detected',
  'â¸ Deezer chart â live viral DNA extracted',
  'â¸ Skip risk at 0:03 and 0:15 â patched with hook elements',
  'â¸ YouTube Music â retention signals mapped',
  'â¸ Reference artist patterns loaded into production engine',
  'â¸ Lyric structure: verse/pre-chorus/chorus optimized',
  'â¸ AI V5 style string assembled with viral parameters',
  'â¸ Vocal texture: matched to genre top performers',
  'â¸ Energy curve: calibrated for max save-rate',
  'â¸ Production elements injected: drums, bass, melody',
  'â¸ Hook at 0:20 confirmed â TikTok snip zone secured',
  'â¸ AI engine render queue: 2 versions queued',
  'â¸ Professional mix & master pipeline active',
];

const ViralCreatePanel = ({ elapsed, genre }: { elapsed: number; genre?: string }) => {
  const currentStageIdx = VIRAL_STAGES.reduce((acc, s, i) => elapsed >= s.at ? i : acc, 0);
  const progress = Math.min(96, Math.round((elapsed / 90) * 100));
  const feedIdx = Math.min(Math.floor(elapsed / 5), INJECT_FEED.length - 1);
  const currentStage = VIRAL_STAGES[currentStageIdx];
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const resolvedGenre = genre || 'your genre';

  return (
    <div className="flex flex-col h-full overflow-y-auto px-3 py-3 space-y-3">

      {/* Waveform â orange/amber for creation */}
      <div className="flex items-end justify-center gap-[1.5px] h-12">
        {Array.from({ length: isMobile ? 16 : 24 }).map((_, i) => (
          <motion.div key={i}
            className="rounded-full bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-300"
            style={{ width: 3, height: '100%', transformOrigin: 'bottom' }}
            animate={{ scaleY: [0.08, 0.3 + Math.abs(Math.sin(i * 0.5)) * 0.7, 0.08] }}
            transition={{ repeat: Infinity, duration: isMobile ? 0.1 : (0.5 + (i % 4) * 0.07), delay: i * 0.04 }}
          />
        ))}
      </div>

      {/* Stage headline */}
      <div className="text-center space-y-0.5">
        <motion.p key={currentStageIdx}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="text-xs font-bold text-foreground leading-snug">
          {currentStage.action}
        </motion.p>
        <p className="text-[10px] text-muted-foreground">{currentStage.detail}</p>
        <p className="text-[10px] text-accent font-semibold">{elapsed}s elapsed</p>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] text-muted-foreground tabular-nums">
          <span>Building your viral hitâ¦</span><span>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden relative">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300"
            style={{ transformOrigin: 'left' }}
            animate={{ scaleX: progress / 100 }}
            transition={{ duration: 0.6 }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          />
        </div>
      </div>

      {/* Platform badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {VIRAL_STAGES.filter(s => s.platform).map(s => {
          const active = elapsed >= s.at;
          return (
            <motion.div key={s.platform}
              animate={{ opacity: active ? 1 : 0.2, scale: active ? 1 : 0.9 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold"
              style={{
                borderColor: active ? `${s.color}40` : 'rgba(255,255,255,0.1)',
                backgroundColor: active ? `${s.color}15` : 'transparent',
                color: active ? s.color : 'rgba(255,255,255,0.25)',
              }}>
              {active && (
                <motion.div className="w-1 h-1 rounded-full" style={{ backgroundColor: s.color }}
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
              )}
              {s.platform}
            </motion.div>
          );
        })}
      </div>

      {/* Stage pipeline */}
      <div className="space-y-1">
        {VIRAL_STAGES.map((s, i) => {
          const done = i < currentStageIdx;
          const active = i === currentStageIdx;
          const pending = i > currentStageIdx;
          return (
            <motion.div key={i}
              animate={{ opacity: done ? 0.6 : active ? 1 : 0.2 }}
              className={`flex items-start gap-2 px-2 py-1.5 rounded-lg text-[10px] ${
                active ? 'bg-orange-500/10 border border-orange-500/20' : ''
              }`}>
              {/* Icon/check */}
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                done ? 'bg-emerald-500/20' : active ? 'bg-orange-500/20' : 'bg-muted/30'
              }`}>
                {done ? <Check className="w-3 h-3 text-emerald-400" /> :
                 active ? (
                   <motion.div className="w-2 h-2 rounded-full bg-orange-400"
                     animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                     transition={{ repeat: Infinity, duration: 0.7 }} />
                 ) : (
                   <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
                 )}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="shrink-0">{s.icon}</span>
                  <span className={`font-semibold truncate ${done ? 'text-emerald-400' : active ? 'text-orange-300' : 'text-muted-foreground/30'}`}>
                    {s.action}
                  </span>
                  {active && (
                    <motion.span className="text-[8px] text-orange-400 font-black shrink-0"
                      animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}>
                      LIVE
                    </motion.span>
                  )}
                </div>
                {(done || active) && (
                  <p className={`text-[9px] mt-0.5 ${done ? 'text-emerald-400/60' : 'text-orange-300/70'}`}>
                    â {s.inject}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Live injection feed */}
      <div className="rounded-xl border border-border/40 bg-muted/20 p-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <motion.div className="w-1.5 h-1.5 rounded-full bg-amber-400"
            animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} />
          <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">Viral Injection Feed</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={feedIdx}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[9px] font-mono text-amber-300/80 leading-snug">
            {INJECT_FEED[feedIdx]}
          </motion.p>
        </AnimatePresence>
      </div>

      {elapsed > 60 && (
        <p className="text-[10px] text-center text-amber-400/70 animate-pulse">
          Still renderingâ¦ AI engine takes 60â120s. Your song won't be lost even if you navigate away.
        </p>
      )}
    </div>
  );
};

const ScanLoadingPanel = ({ elapsed, step }: { elapsed: number; step: string }) => {
  const currentStepIdx = SCAN_STEPS.reduce((acc, s, i) => elapsed >= s.at ? i : acc, 0);
  const progress = Math.min(96, Math.round((elapsed / 90) * 100));
  const feedLine = LIVE_FEED[Math.min(Math.floor(elapsed / 5), LIVE_FEED.length - 1)];
  const current = SCAN_STEPS[currentStepIdx];

  return (
    <div className="flex flex-col h-full p-3 space-y-3 overflow-y-auto">
      {/* Waveform animation */}
      <div className="flex items-end justify-center gap-[1.5px] h-16 pt-2">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.div key={i}
            className="rounded-full bg-gradient-to-t from-primary via-primary/80 to-accent"
            style={{ width: 3, height: '100%', transformOrigin: 'bottom' }}
            animate={{ scaleY: [0.08, 0.3 + Math.abs(Math.sin(i * 0.6)) * 0.7, 0.08] }}
            transition={{ repeat: Infinity, duration: 0.5 + (i % 5) * 0.07, delay: i * 0.04, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Current step headline */}
      <div className="text-center space-y-1">
        <motion.p className="text-xs font-bold text-foreground leading-snug"
          key={currentStepIdx}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
          {current.label}
        </motion.p>
        <p className="text-[10px] text-muted-foreground tabular-nums">{elapsed}s elapsed</p>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] text-muted-foreground tabular-nums">
          <span>Analyzingâ¦</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden relative">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary"
            style={{ backgroundSize: '200% 100%', transformOrigin: 'left' }}
            animate={{ scaleX: progress / 100, backgroundPosition: ['0% 0%', '100% 0%'] }}
            transition={{ scaleX: { duration: 0.6 }, backgroundPosition: { repeat: Infinity, duration: 2, ease: 'linear' } }}
          />
          {/* Shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          />
        </div>
      </div>

      {/* Platform badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {[
          { label: 'Spotify', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', active: elapsed >= 6 },
          { label: 'Apple Music', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20', active: elapsed >= 16 },
          { label: 'TikTok', color: 'text-white bg-white/10 border-white/20', active: elapsed >= 26 },
          { label: 'YouTube', color: 'text-red-400 bg-red-500/10 border-red-500/20', active: elapsed >= 36 },
        ].map(p => (
          <motion.span key={p.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: p.active ? 1 : 0.25, scale: p.active ? 1 : 0.9 }}
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${p.color} transition-all`}>
            {p.active && <motion.span className="inline-block w-1 h-1 rounded-full bg-current mr-1 align-middle"
              animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} />}
            {p.label}
          </motion.span>
        ))}
      </div>

      {/* Step checklist */}
      <div className="space-y-1.5">
        {SCAN_STEPS.map((s, i) => {
          const done = i < currentStepIdx;
          const active = i === currentStepIdx;
          return (
            <motion.div key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: done ? 0.6 : active ? 1 : 0.25, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-[10px] ${active ? 'bg-primary/10 border border-primary/20' : ''}`}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500' : active ? 'bg-primary/20 border border-primary' : 'bg-muted/50'}`}>
                {done ? (
                  <Check className="w-2.5 h-2.5 text-white" />
                ) : active ? (
                  <motion.div className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 0.7 }} />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
                )}
              </div>
              <span className={done ? 'text-emerald-400' : active ? `font-semibold ${s.color}` : 'text-muted-foreground/40'}>
                {s.label}
              </span>
              {done && <Check className="w-2.5 h-2.5 text-emerald-400 ml-auto shrink-0" />}
              {active && <motion.span className="text-[8px] text-primary font-bold ml-auto shrink-0"
                animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                LIVE
              </motion.span>}
            </motion.div>
          );
        })}
      </div>

      {/* Live data feed */}
      <div className="rounded-xl border border-border/50 bg-muted/30 p-2.5 space-y-1">
        <div className="flex items-center gap-1.5 mb-1">
          <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} />
          <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">Live Analysis Feed</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={feedLine}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className="text-[9px] font-mono text-muted-foreground leading-snug">
            <span className="text-emerald-400">â¸</span> {feedLine}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

const WorkspacePlayer = () => {
  const {
    currentTrack, isPlaying, progress, duration, currentTime, volume,
    togglePlay, seek, setVolume, closePlayer,
  } = useAudioPlayer();

  const fmtT = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const [showVol, setShowVol] = useState(false);

  if (!currentTrack) {
    return (
      <div className="h-14 border-t border-border/40 bg-card/60 flex items-center px-4 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center">
          <Music2 className="w-3.5 h-3.5 text-muted-foreground/30" />
        </div>
        <p className="text-xs text-muted-foreground/40">No track playing â select a song above</p>
      </div>
    );
  }

  const handleDownload = async () => {
    if (!currentTrack?.audioUrl) return;
    try {
      const res = await fetch(currentTrack.audioUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `${currentTrack.title || 'track'}.mp3`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { window.open(currentTrack.audioUrl, '_blank'); }
  };

  return (
    <motion.div
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-[64px] border-t border-border/40 bg-card/90 backdrop-blur-xl flex items-center gap-3 px-3 shrink-0"
    >
      {/* Art + title */}
      <div className="flex items-center gap-2 w-44 shrink-0 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center overflow-hidden shrink-0">
          {currentTrack.imageUrl
            ? <img src={currentTrack.imageUrl} alt="" className="w-full h-full object-cover" />
            : <Music2 className="w-4 h-4 text-primary" />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{currentTrack.title}</p>
        </div>
      </div>

      {/* Controls + seek */}
      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => seek(Math.max(0, progress - 5))} className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors shadow">
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-primary-foreground" /> : <Play className="w-3.5 h-3.5 text-primary-foreground ml-0.5" />}
          </button>
          <button onClick={() => seek(Math.min(100, progress + 5))} className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 w-full">
          <span className="text-[9px] text-muted-foreground tabular-nums w-7 text-right shrink-0">{fmtT(currentTime)}</span>
          <input type="range" min={0} max={100} value={progress}
            onChange={e => seek(Number(e.target.value))}
            className="flex-1 h-1 rounded-full appearance-none cursor-pointer bg-secondary
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
            style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${progress}%, hsl(var(--secondary)) ${progress}%)` }}
          />
          <span className="text-[9px] text-muted-foreground tabular-nums w-7 shrink-0">{fmtT(duration)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <div className="relative">
          <button onClick={() => setShowVol(!showVol)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          {showVol && (
            <div className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-xl p-3 w-28 shadow-lg z-10">
              <input type="range" min={0} max={1} step={0.05} value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer bg-secondary
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${volume * 100}%, hsl(var(--secondary)) ${volume * 100}%)` }}
              />
            </div>
          )}
        </div>
        <button onClick={handleDownload}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          <Download className="w-3.5 h-3.5" />
        </button>
        <button onClick={closePlayer}
          className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

const Waveform = ({ active = false, small = false }: { active?: boolean; small?: boolean }) => (
  <div className={`flex items-end gap-[1.5px] ${small ? 'h-5 w-10' : 'h-8 w-14'}`}>
    {Array.from({ length: small ? 8 : 14 }).map((_, i) => (
      <motion.div key={i}
        className={`rounded-full ${active ? 'bg-primary' : 'bg-muted-foreground/30'}`}
        style={{ width: small ? 1.5 : 2, height: `${20 + Math.sin(i * 0.7) * 60 + 20}%` }}
        animate={active ? { scaleY: [0.3, 1, 0.3] } : undefined}
        transition={{ repeat: Infinity, duration: 0.5 + (i % 3) * 0.1, delay: i * 0.05, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

/* âââ Credits Buy Modal âââ */
interface CreditsModalProps { onClose: () => void; onBuy: (priceId: string, packId: string) => void; loading: string | null; }
const CreditsModal = ({ onClose, onBuy, loading }: CreditsModalProps) => {
  const packs = [
    { id: 'credits_100', credits: 100, price: 9, label: 'Starter' },
    { id: 'credits_300', credits: 300, price: 19, label: 'Popular', popular: true },
    { id: 'credits_700', credits: 700, price: 39, label: 'Best Value' },
  ];
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-foreground">Buy Credits</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          {packs.map(p => (
            <button key={p.id}
              disabled={loading === p.id}
              onClick={() => onBuy(p.id, p.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                p.popular
                  ? 'border-primary/40 bg-primary/5 hover:bg-primary/10'
                  : 'border-border hover:border-primary/30 hover:bg-primary/5'
              }`}>
              <div className="flex items-center gap-3">
                <CreditCard className={`w-4 h-4 ${p.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <p className={`font-semibold text-sm ${p.popular ? 'text-foreground' : 'text-foreground/80'}`}>
                    {p.credits.toLocaleString()} credits
                    {p.popular && <span className="ml-2 text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">POPULAR</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{p.label}</p>
                </div>
              </div>
              <span className={`font-black text-lg ${p.popular ? 'text-primary' : 'text-foreground'}`}>
                {loading === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : `$${p.price}`}
              </span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-4">Credits never expire Â· One-time purchase</p>
      </div>
    </div>
  );
};

/* âââ Upgrade gate âââ */
const UpgradeGate = () => (
  <div className="flex flex-col items-center justify-center text-center h-full px-4 py-8 space-y-4">
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30 flex items-center justify-center">
      <Lock className="w-5 h-5 text-accent" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-foreground">Pro Feature</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-[180px] mx-auto leading-relaxed">
        Upgrade to create AI-generated viral songs
      </p>
    </div>
    <Button asChild size="sm" className="bg-gradient-to-r from-accent to-yellow-500 text-black font-bold border-0 rounded-xl gap-1.5 text-xs">
      <Link to="/dashboard/billing"><Crown className="w-3.5 h-3.5" /> Upgrade â $29/mo</Link>
    </Button>
  </div>
);

/* âââââââââââââââââââââââââââââââââââââââââââââââââââ
   WORKSPACE
ââââââââââââââââââââââââââââââââââââââââââââââââââââ */
export default function Workspace() {
  const { user, session, profile, refreshProfile } = useAuth();
  const { playTrack, currentTrack, isPlaying, progress, currentTime, duration, togglePlay, seek, volume, setVolume } = useAudioPlayer();
  const navigate = useNavigate();

  const plan = (profile?.plan ?? 'free') as keyof typeof PLAN_LIMITS;
  const canCreate = plan !== 'free' || profile?.is_admin === true;
  const credits = profile?.credits ?? 0;

  /* âââ Data âââ */
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [remixes, setRemixes] = useState<Remix[]>([]);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState<Set<string>>(new Set());

  /* âââ UI âââ */
  const [tab, setTab] = useState<CenterTab>('all');
  const [leftMode, setLeftMode] = useState<'analyze' | 'create'>('create');
  const [activeItem, setActiveItem] = useState<SongItem | null>(null);
  const [rightOpen, setRightOpen] = useState(true);
  const [showStyleSuggestions, setShowStyleSuggestions] = useState(false);
  // Mobile: which view to show (center feed is default)
  const [mobileView, setMobileView] = useState<'feed' | 'create' | 'detail'>('feed');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /* âââ Analyze state âââ */
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [lastScanS3Key, setLastScanS3Key] = useState<string | null>(() => {
    try { return localStorage.getItem('hitcheck_lastS3Key'); } catch { return null; }
  });
  const [songTitle, setSongTitle] = useState('');
  const [songGenre, setSongGenre] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState('');
  const [analyzeElapsed, setAnalyzeElapsed] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [lastAnalysisResult, setLastAnalysisResult] = useState<any>(null);
  const analyzeTimerRef = useRef<ReturnType<typeof setInterval>>();

  /* âââ Create state âââ */
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [createLyrics, setCreateLyrics] = useState('');
  const STYLE_KEY = user ? `hitcheck_style_${user.id}` : 'hitcheck_style';
  const [createStyle, setCreateStyle] = useState(() => {
    try { return localStorage.getItem('hitcheck_style_last') || ''; } catch { return ''; }
  });
  const [lyricsExpanded, setLyricsExpanded] = useState(true);
  const [stylesExpanded, setStylesExpanded] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateElapsed, setGenerateElapsed] = useState(0);
  const generateTimerRef = useRef<ReturnType<typeof setInterval>>();
  const [sunoVersion, setSunoVersion] = useState<'v5' | 'v4.5'>('v5');
  const [enhanceLyricsPrompt, setEnhanceLyricsPrompt] = useState('');
  const [enhancingLyrics, setEnhancingLyrics] = useState(false);
  const [shownChips, setShownChips] = useState<string[]>(() => shuffleArray(VIRAL_STYLE_CHIPS).slice(0, 10));
  const [songMoreMenuId, setSongMoreMenuId] = useState<string | null>(null);
  const [feedSearch, setFeedSearch] = useState('');
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsModalLoading, setCreditsModalLoading] = useState<string | null>(null);
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});
  const [justGenerated, setJustGenerated] = useState(false);

  /* âââ Load data âââ */
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: a }, { data: r }] = await Promise.all([
      supabase.from('viralize_analyses').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(50),
      supabase.from('viralize_remixes').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(50),
    ]);
    setAnalyses(a || []);
    setRemixes(r || []);
    setLikes(getLikes(user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); if (user) setPlayCounts(getPlayCounts(user.id)); }, [loadData]);
  useEffect(() => () => {
    if (analyzeTimerRef.current) clearInterval(analyzeTimerRef.current);
    if (generateTimerRef.current) clearInterval(generateTimerRef.current);
  }, []);

  // Resume any pending generation after navigation
  useEffect(() => {
    if (!user) return;
    const pending = loadPendingGeneration(user.id);
    if (!pending) return;
    // If started more than 10 minutes ago, clear it
    if (Date.now() - pending.startedAt > 10 * 60 * 1000) {
      clearPendingGeneration(user.id);
      return;
    }
    // Resume polling
    setGenerating(true);
    setGenerateElapsed(Math.floor((Date.now() - pending.startedAt) / 1000));
    generateTimerRef.current = setInterval(() => setGenerateElapsed(e => e + 1), 1000);

    const resumePoll = async () => {
      // FIX: Lambda poll-suno requires individual taskId (singular)
      const pollSingleTaskResume = async (taskId: string, label: string): Promise<{audioUrl:string,imageUrl?:string,label:string}> => {
        for (let i = 0; i < 45; i++) {
          await new Promise(r => setTimeout(r, 8000));
          const pr = await fetch(LAMBDA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'poll-suno', taskId }) });
          const d = await pr.json();
          if (d.status === 'complete' && d.audioUrl) return { audioUrl: d.audioUrl, imageUrl: d.imageUrl, label };
          if (d.status === 'failed' || d.error) throw new Error(d.error || `Generation failed for ${label}`);
        }
        throw new Error('Timed out');
      };

      try {
        const [rr1, rr2] = await Promise.allSettled([
          pollSingleTaskResume(pending.taskIdV1, pending.version1Label),
          pending.taskIdV2 && pending.taskIdV2 !== pending.taskIdV1 ? pollSingleTaskResume(pending.taskIdV2, pending.version2Label) : Promise.reject(new Error('no v2')),
        ]);
        clearInterval(generateTimerRef.current);
        const tracks: any[] = [];
        if (rr1.status === 'fulfilled') tracks.push(rr1.value);
        if (rr2.status === 'fulfilled') tracks.push(rr2.value);
        // Save to Supabase via edge function (service_role key â bypasses RLS)
        const savedResumeUrls = new Set<string>();
        for (const t of tracks) {
          if (!t.audioUrl || savedResumeUrls.has(t.audioUrl)) continue;
          savedResumeUrls.add(t.audioUrl);
          try {
            await fetch(`${SUPABASE_URL}/functions/v1/save-remix`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON}`,
              },
              body: JSON.stringify({
                userId: user.id,
                analysisId: pending.analysisId,
                audioUrl: t.audioUrl,
                imageUrl: t.imageUrl || null,
                sunoTaskId: pending.taskIdV1,
                genre: pending.genre,
                originalTitle: pending.title,
                remixTitle: t.label,
              }),
            });
          } catch {}
        }
        clearPendingGeneration(user.id);
        await loadData(); setGenerating(false);
        toast.success(`ð Your Algorithm Hits are ready! Check "My Hits" tab.`); setTab('created');
        setJustGenerated(true); setTimeout(() => setJustGenerated(false), 15000);
      } catch (e: any) {
        clearInterval(generateTimerRef.current);
        clearPendingGeneration(user.id);
        setGenerating(false);
        toast.error(e.message || 'Generation failed');
      }
    };
    resumePoll();
  }, [user]); // run once on mount

  /* âââ Auto-fill create from active analysis âââ */
  const activeItemId = activeItem?.data?.id;
  useEffect(() => {
    if (activeItem?.type === 'analysis') {
      const r = activeItem.data.full_result;
      if (!r) return;
      // FIX: check ai_transcript column first (Whisper transcript saved by Lambda directly)
      // then fall back to full_result lyrics
      const aiTranscript = (activeItem.data as any).ai_transcript;
      if (aiTranscript) {
        setCreateLyrics(aiTranscript); // Real Whisper transcript — best quality
      } else if (r.lyricsSource === 'transcribed' && r.originalLyrics) {
        setCreateLyrics(r.originalLyrics);
      } else if (r.improvedLyrics || r.originalLyrics) {
        setCreateLyrics(r.improvedLyrics || r.originalLyrics);
      }
      // Always build style from analysis data
      const tags: string[] = [];
      if (activeItem.data.genre) tags.push(activeItem.data.genre.toLowerCase());
      if (r.bpmEstimate) tags.push(String(r.bpmEstimate).toLowerCase());
      if (r.musicalKey) tags.push(r.musicalKey.toLowerCase());
      if (r.dominantInstrument) tags.push(r.dominantInstrument.toLowerCase());
      if (r.emotionalCore) tags.push(r.emotionalCore.toLowerCase().slice(0, 30));
      if (tags.length) setCreateStyle(tags.slice(0, 5).join(', '));
    }
  }, [activeItemId]);

  // Persist style between sessions
  useEffect(() => {
    if (createStyle) {
      try { localStorage.setItem('hitcheck_style_last', createStyle); } catch {}
    }
  }, [createStyle]);

  /* âââ Filtered center feed âââ */
  const feedItems = useMemo((): SongItem[] => {
    // Deduplicate remixes by audio_url to prevent showing same song twice
    const seenUrls = new Set<string>();
    const uniqueRemixes = remixes.filter(r => {
      if (!r.audio_url) return true;
      if (seenUrls.has(r.audio_url)) return false;
      seenUrls.add(r.audio_url);
      return true;
    });

    const all: SongItem[] = [
      ...analyses.map(a => ({ type: 'analysis' as const, data: a })),
      ...uniqueRemixes.map(r => ({ type: 'remix' as const, data: r })),
    ].sort((a, b) => new Date(
      a.type === 'analysis' ? a.data.created_at : a.data.created_at || ''
    ).getTime() - new Date(
      b.type === 'analysis' ? b.data.created_at : b.data.created_at || ''
    ).getTime()).reverse();

    const filtered = feedSearch.trim()
      ? all.filter(i => {
          const t = getTitle(i).toLowerCase();
          const g = getStyleTags(i).toLowerCase();
          const q = feedSearch.toLowerCase();
          return t.includes(q) || g.includes(q);
        })
      : all;

    if (tab === 'liked') return filtered.filter(i => likes.has(i.data.id));
    if (tab === 'uploads') return filtered.filter(i => i.type === 'analysis');
    if (tab === 'created') return filtered.filter(i => i.type === 'remix');
    return filtered;
  }, [analyses, remixes, tab, likes, feedSearch]);

  /* âââ Like handler âââ */
  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const isNowLiked = toggleLike(user.id, id);
    setLikes(getLikes(user.id));
    toast.success(isNowLiked ? 'â¤ï¸ Added to Liked' : 'Removed from Liked', { duration: 1500 });
  };

  /* âââ Share âââ */
  const handleShare = (item: SongItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = item.type === 'remix'
      ? item.data.audio_url
      : `${window.location.origin}/song/${item.data.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(item.data.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Link copied!', { duration: 1500 });
  };

  /* âââ Accept file âââ */
  const acceptFile = (f: File, target: 'analyze' | 'create') => {
    if (!f.name.match(/\.(mp3|wav)$/i)) { toast.error('MP3 or WAV only'); return; }
    if (f.size > 100 * 1024 * 1024) { toast.error('Max 100MB'); return; }
    if (target === 'analyze') {
      setUploadFile(f);
      if (!songTitle) setSongTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    } else {
      setCreateFile(f);
    }
  };

  const pickFile = (target: 'analyze' | 'create') => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.mp3,.wav,audio/*';
    inp.onchange = () => { if (inp.files?.[0]) acceptFile(inp.files[0], target); };
    inp.click();
  };

  /* âââ BUY CREDITS (modal) âââ */
  const handleBuyCreditsModal = async (packId: string, _unused: string) => {
    if (!user?.id) { toast.error('Sign in first'); return; }
    const priceId = packId === 'credits_100' ? PRICES.credits_100
      : packId === 'credits_300' ? PRICES.credits_300
      : PRICES.credits_700;
    setCreditsModalLoading(packId);
    toast.loading('Redirecting to checkoutâ¦', { id: 'credits-checkout' });
    const r = await createCheckoutSession(priceId, user.id, 'payment');
    toast.dismiss('credits-checkout');
    setCreditsModalLoading(null);
    if (r === null) {
      toast.error('Checkout unavailable. Try again.');
    } else {
      setShowCreditsModal(false);
    }
  };

  /* âââ ANALYZE âââ */
  const handleAnalyze = async () => {
    if (!uploadFile) return;
    // Credit check
    if (credits < CREDIT_COSTS.analysis) {
      setShowCreditsModal(true);
      return;
    }
    setAnalyzing(true); setAnalyzeElapsed(0);
    analyzeTimerRef.current = setInterval(() => setAnalyzeElapsed(e => e + 1), 1000);
    let insertedAnalysis: any = null;
    try {
      setAnalyzeStep('Uploading your trackâ¦');
      const urlRes = await fetch(LAMBDA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-upload-url', fileName: uploadFile.name, contentType: uploadFile.type || 'audio/mpeg' }) });
      if (!urlRes.ok) throw new Error('Upload URL failed â please try again');
      const { uploadUrl, s3Key } = await urlRes.json();
      if (!uploadUrl || !s3Key) throw new Error('Could not start upload â please try again');
      setLastScanS3Key(s3Key); // save for use in Algorithm Hit creation
      try { localStorage.setItem('hitcheck_lastS3Key', s3Key); } catch {}

      setAnalyzeStep('Uploading to our serversâ¦');
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: uploadFile,
        headers: { 'Content-Type': uploadFile.type || 'audio/mpeg' },
      });
      if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status}) â try a different file`);

      setAnalyzeStep('Scanning your track with AI (30–90 seconds)…');
      // FIX: Lambda runs Whisper+GPT synchronously in the analyze action.
      // It returns full results immediately — no need for poll loop.
      // The old poll-based flow returned empty data on cold start (cache miss).
      const analyzeRes = await fetch(LAMBDA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', s3Key, title: songTitle || uploadFile.name, genre: songGenre }) });
      if (!analyzeRes.ok) throw new Error('Analysis server error — please try again');
      const analyzeRaw = await analyzeRes.json();
      if (analyzeRaw.error && !analyzeRaw.score) {
        // Clear stale s3Key if file expired
        if (analyzeRaw.error.includes('not found') || analyzeRaw.error.includes('upload again')) {
          setLastScanS3Key(null);
          try { localStorage.removeItem('hitcheck_lastS3Key'); } catch {}
        }
        throw new Error(analyzeRaw.error);
      }
      // Normalize score field
      let lambdaData: any = { ...analyzeRaw };
      lambdaData.score = lambdaData.score || lambdaData.viralScore || 0;
      // Fallback: if no score yet, try one poll (handles rare async Lambda behavior)
      if (!lambdaData.score && lambdaData.jobId) {
        setAnalyzeStep('Finalizing analysis…');
        await new Promise(r => setTimeout(r, 5000));
        try {
          const prFb = await fetch(LAMBDA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'poll', jobId: lambdaData.jobId }) });
          if (prFb.ok) {
            const pdFb = await prFb.json();
            if (pdFb.score || pdFb.viralScore) lambdaData = { ...lambdaData, ...pdFb, score: pdFb.score || pdFb.viralScore };
          }
        } catch {}
      }
      // Proceed with lambdaData as the analysis result
      await (async (data: any) => {
        if (true) {
          if (!data.score) throw new Error('Analysis returned no results — please try again');nrich with Claude AI + save to DB via edge function (uses service_role key â bypasses RLS)
          setAnalyzeStep('Building hit intelligence with AIâ¦');
          let enrichedData = data;
          try {
            const enrichRes = await fetch(`${SUPABASE_URL}/functions/v1/analyze-song`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                // Use user's session JWT so edge fn gets auth context; fall back to anon
                'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON}`,
              },
              body: JSON.stringify({
                lambdaResult: data,
                title: songTitle || uploadFile.name,
                genre: songGenre || data.genre || '',
                goal: 'maximize streams',
                userId: user?.id,        // edge fn inserts analysis using service_role key
                fileSizeBytes: uploadFile.size,
                s3Key,
              }),
            });
            if (enrichRes.ok) {
              const enrichJson = await enrichRes.json();
              enrichedData = enrichJson;
              enrichedData.s3Key = s3Key;
              // Edge function returns analysisId of the inserted/updated DB record
              if (enrichJson.analysisId) {
                insertedAnalysis = { id: enrichJson.analysisId, user_id: user?.id, title: songTitle || uploadFile.name, genre: songGenre || data.genre || '', score: enrichJson.score || data.score, created_at: new Date().toISOString(), full_result: enrichedData };
              }
            } else {
              const errText = await enrichRes.text();
              console.warn('analyze-song enrichment failed:', enrichRes.status, errText);
            }
          } catch (enrichErr) {
            console.warn('analyze-song enrichment error (non-fatal):', enrichErr);
          }

          // Step 3: Save enriched data to DB from frontend too (belt & suspenders)
          if (insertedAnalysis?.id) {
            await supabase.from('viralize_analyses').update({
              score: enrichedData.score || data.score,
              verdict: enrichedData.verdict || data.verdict,
              full_result: { ...enrichedData, s3Key },
              genre: enrichedData.genre || songGenre || data.genre || '',
            }).eq('id', insertedAnalysis.id);
          }

          // Step 4: Reload then set active item with enriched data
          await loadData();
          if (insertedAnalysis) {
            setActiveItem({ type: 'analysis', data: {
              ...insertedAnalysis,
              score: enrichedData.score || data.score,
              verdict: enrichedData.verdict || data.verdict,
              full_result: { ...enrichedData, s3Key },
              genre: enrichedData.genre || songGenre || data.genre || '',
            }});
            setTab('uploads');
          }
          // FIX: Read ai_transcript from DB (Lambda saves it there directly, doesn't return in response)
          // Then fill editor: real transcript > AI lyrics
          let finalLyrics = '';
          if (insertedAnalysis?.id) {
            try {
              const { data: dbRow } = await supabase
                .from('viralize_analyses')
                .select('ai_transcript')
                .eq('id', insertedAnalysis.id)
                .single();
              if (dbRow?.ai_transcript) {
                finalLyrics = dbRow.ai_transcript; // Real Whisper transcript from Lambda
                console.log('[Lyrics] Using Whisper transcript from DB:', finalLyrics.slice(0, 60));
              }
            } catch (e) { console.warn('[Lyrics] DB transcript read failed:', e); }
          }
          // Fallback to enriched data lyrics if no DB transcript
          if (!finalLyrics) {
            finalLyrics = enrichedData.lyricsSource === 'transcribed'
              ? enrichedData.originalLyrics
              : (enrichedData.improvedLyrics || enrichedData.originalLyrics || '');
          }
          if (finalLyrics && !createLyrics) {
            setCreateLyrics(finalLyrics);
            console.log('[Lyrics] Editor auto-filled after scan');
          }

          // Step 5: Deduct credits AFTER successful analysis
          if (user) {
            const deductResult = await deductCredits(user.id, CREDIT_COSTS.analysis);
            if (deductResult.success && deductResult.newCredits !== undefined) {
              await refreshProfile();
            }
          }
          clearInterval(analyzeTimerRef.current);
          setAnalyzing(false); setUploadFile(null); setSongTitle(''); setSongGenre('');
          setLastAnalysisResult({ ...enrichedData, dbRecord: insertedAnalysis });
          toast.success(`ð¯ Score: ${enrichedData.score}/100 â ${CREDIT_COSTS.analysis} credits used`);
        } else if (data.status === 'error') {
          throw new Error(data.error || 'Analysis failed — please try again');
        }
        // FIX: poll loop removed — Lambda returns full analysis synchronously
      })(lambdaData);
    } catch (e: any) {
      clearInterval(analyzeTimerRef.current); setAnalyzing(false);
      const msg = e.message || 'Scan failed â please try again';
      toast.error(msg, { duration: 8000, description: 'If this keeps happening, try a shorter MP3 file.' });
    }
  };

  /* âââ CREATE VIRAL âââ */
  const handleCreate = async () => {
    if (!user) { toast.error('Sign in required'); return; }
    if (generating) { toast.error('Already generating — please wait'); return; } // FIX: prevent double-calls

    // Determine s3Key â priority order:
    // 1. activeItem analysis/remix audio_url (selected from library)
    // 2. lastScanS3Key (from the scan just completed â KEY FIX)
    // 3. Manually uploaded createFile
    const anyAudioUrl =
      (activeItem?.type === 'analysis' ? activeItem.data.audio_url : null) ||
      (activeItem?.type === 'remix' ? activeItem.data.audio_url : null) || null;
    // Also check full_result.s3Key â stored by analyze-song edge function for cross-session use
    const s3KeyFromResult = activeItem?.type === 'analysis'
      ? (activeItem.data.full_result?.s3Key || null) : null;
    const existingS3Key = s3KeyFromResult || lastScanS3Key || (anyAudioUrl ? extractS3Key(anyAudioUrl) : null);
    console.log('[Create] s3Key resolution:', { s3KeyFromResult, lastScanS3Key, final: existingS3Key });

    // Must have EITHER a file OR a pre-existing S3 key
    if (!createFile && !existingS3Key) {
      toast.error('Upload an audio file or scan a song first', { duration: 5000 });
      return;
    }

    // Credit check
    if (credits < CREDIT_COSTS.viral) {
      setShowCreditsModal(true);
      return;
    }
    setGenerating(true); setGenerateElapsed(0);
    generateTimerRef.current = setInterval(() => setGenerateElapsed(e => e + 1), 1000);
    try {
      // Use existing S3 key if available (selected analysis has audio), else upload new file
      let s3Key = existingS3Key || '';
      if (!s3Key && createFile) {
        const urlRes = await fetch(LAMBDA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-upload-url', fileName: createFile.name, contentType: createFile.type || 'audio/mpeg' }) });
        const urlData = await urlRes.json();
        s3Key = urlData.s3Key;
        await fetch(urlData.uploadUrl, { method: 'PUT', headers: { 'Content-Type': createFile.type || 'audio/mpeg' }, body: createFile });
      }

      // Build enriched Suno payload â combine analysis data + genre DNA from admin panel
      const fr = activeItem?.type === 'analysis' ? activeItem.data.full_result || {} : {};
      const songGenreForCover = activeItem?.type === 'analysis' ? activeItem.data.genre : (createStyle?.split(',')[0]?.trim() || 'pop');
      const songTitleForCover = activeItem?.type === 'analysis' ? activeItem.data.title : (createFile?.name?.replace(/\.[^.]+$/, '') || 'My Song');

      // Fetch genre DNA from suno_genre_dna table for rich production styles
      let genreDna: any = null;
      try {
        const { data: dnaRows } = await supabase
          .from('suno_genre_dna')
          .select('suno_style_prefix, suno_style_suffix, viral_elements, bpm_range, typical_key, hook_timing, reference_artists, reference_tracks')
          .ilike('genre', `%${songGenreForCover}%`)
          .limit(1);
        if (dnaRows && dnaRows.length > 0) genreDna = dnaRows[0];
      } catch (e) { console.warn('[GenreDNA] fetch failed:', e); }

      // Build a professional style string: user style + genre DNA prefix/suffix + viral elements
      const styleComponents = [
        createStyle && createStyle !== 'same' ? createStyle : '',
        genreDna?.suno_style_prefix || '',
        genreDna?.suno_style_suffix || '',
        ...(genreDna?.viral_elements || []).slice(0, 4),
        fr.emotionalCore ? fr.emotionalCore.slice(0, 40) : '',
        'full song structure', 'professional mix', 'radio ready',
      ].filter(Boolean);
      // Deduplicate and join
      const enrichedStyle = [...new Set(styleComponents.map(s => s.toLowerCase().trim()))].join(', ');

      // Build auto-prompt only if user hasn't written custom lyrics
      const autoPrompt = [
        `${songGenreForCover} hit song`,
        fr.bpmEstimate ? `${Math.round(fr.bpmEstimate)} BPM` : (genreDna?.bpm_range ? `${genreDna.bpm_range} BPM` : ''),
        'high energy', 'strong hook in first 7 seconds',
        fr.emotionalCore ? fr.emotionalCore.slice(0, 60) : '',
        fr.improvements?.length ? `improved: ${fr.improvements.slice(0, 3).join(', ').slice(0, 100)}` : '',
        fr.oneChange ? fr.oneChange.slice(0, 80) : '',
        genreDna?.reference_artists?.length ? `inspired by ${genreDna.reference_artists.slice(0, 2).join(' & ')}` : '',
        'radio ready', 'viral potential', 'full length song',
      ].filter(Boolean).join(', ');
      // FIX: customLyrics = actual song lyrics (user edited or transcript).
      // sunoPrompt = style/production guidance for Suno (sent as separate field).
      // Never send fr.sunoPrompt as customLyrics — it's a style directive, not song text.
      const effectiveLyrics = createLyrics.trim() || fr.originalLyrics || '';
      // sunoPrompt: Claude-generated production guidance (separate from lyrics)
      const effectiveSunoPrompt = fr.sunoPrompt || fr.sunoPromptFaithful || autoPrompt;

      const coverRes = await fetch(LAMBDA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suno-cover', s3Key,
          title: songTitleForCover,
          genre: songGenreForCover,
          style: enrichedStyle,
          styles: enrichedStyle,
          lyrics: effectiveLyrics,
          customLyrics: effectiveLyrics,
          sunoPrompt: effectiveSunoPrompt,
          // FIX: preserve original vocal gender — male/female detected from audio
          vocalGender: fr.vocalGender || (activeItem?.data as any)?.vocalGender || undefined,
          bpm: fr.bpmEstimate ? parseFloat(String(fr.bpmEstimate)) : (fr.bpm || fr.genreDna?.avgBpm || undefined),
          energy: fr.energyLevel != null ? (Number(fr.energyLevel) > 1 ? Number(fr.energyLevel) / 10 : Number(fr.energyLevel)) : undefined,
          emotionalCore: fr.emotionalCore,
          viralLine: fr.viralLine,
          oneChange: fr.oneChange,
          improvements: (fr.improvements || []).slice(0, 3),
          sunoVersion,
          // Genre DNA for Lambda to build optimal Suno params
          genreDna: genreDna ? {
            stylePrefix: genreDna.suno_style_prefix,
            styleSuffix: genreDna.suno_style_suffix,
            viralElements: genreDna.viral_elements,
            bpmRange: genreDna.bpm_range,
            typicalKey: genreDna.typical_key,
            hookTiming: genreDna.hook_timing,
            referenceArtists: genreDna.reference_artists,
          } : undefined,
          make_instrumental: !createLyrics.trim(),
          duration: 'full',
        }) });
      const coverData = await coverRes.json();
      console.log('[Suno] Lambda suno-cover response:', JSON.stringify(coverData).slice(0, 800));
      if (coverData.error) throw new Error(`Suno error: ${coverData.error}`);
      if (!coverRes.ok) throw new Error(`Server returned ${coverRes.status}. Please try again.`);
      // Support both {taskIdV1, taskIdV2} and single {taskId} formats
      const taskIdV1 = coverData.taskIdV1 || coverData.taskId;
      const taskIdV2 = coverData.taskIdV2 || coverData.taskId;
      const version1 = coverData.version1;
      const version2 = coverData.version2;
      if (!taskIdV1) throw new Error(`AI engine did not return task IDs. Response: ${JSON.stringify(coverData).slice(0, 200)}`);
      // Save to localStorage IMMEDIATELY before polling starts
      if (user) savePendingGeneration(user.id, {
        taskIdV1, taskIdV2,
        version1Label: version1?.label || 'Faithful Remix',
        version2Label: version2?.label || 'Viral Edition',
        title: activeItem?.type === 'analysis' ? activeItem.data.title : (createFile?.name || 'My Song'),
        genre: activeItem?.type === 'analysis' ? activeItem.data.genre : 'pop',
        analysisId: activeItem?.type === 'analysis' ? activeItem.data.id : null,
        startedAt: Date.now(),
      });
      // FIX: Lambda poll-suno requires individual taskId (singular), not taskIdV1/V2 combined
      const pollSingleTask = async (taskId: string, label: string): Promise<{audioUrl:string,imageUrl?:string,label:string}> => {
        for (let i = 0; i < 45; i++) {
          await new Promise(r => setTimeout(r, 8000));
          const pr = await fetch(LAMBDA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'poll-suno', taskId }) });
          const d = await pr.json();
          if (d.status === 'complete' && d.audioUrl) return { audioUrl: d.audioUrl, imageUrl: d.imageUrl, label };
          if (d.status === 'failed' || d.error) throw new Error(d.error || `Generation failed for ${label}`);
        }
        throw new Error('Timed out — try again');
      };
      const [res1, res2] = await Promise.allSettled([
        taskIdV1 ? pollSingleTask(taskIdV1, version1?.label || 'Faithful Remix') : Promise.reject(new Error('no taskIdV1')),
        taskIdV2 && taskIdV2 !== taskIdV1 ? pollSingleTask(taskIdV2, version2?.label || 'Viral Edition') : Promise.reject(new Error('no taskIdV2')),
      ]);
      clearInterval(generateTimerRef.current);
      const tracks: any[] = [];
      if (res1.status === 'fulfilled') tracks.push(res1.value);
      if (res2.status === 'fulfilled') tracks.push(res2.value);
      if (tracks.length === 0) throw new Error((res1 as any).reason?.message || 'Generation failed');
      // Save to Supabase via edge function (service_role key â bypasses RLS)
      const savedUrls = new Set<string>();
      for (const t of tracks) {
        if (!t.audioUrl || savedUrls.has(t.audioUrl)) continue;
        savedUrls.add(t.audioUrl);
        try {
          const saveRes = await fetch(`${SUPABASE_URL}/functions/v1/save-remix`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON}`,
            },
            body: JSON.stringify({
              userId: user.id,
              analysisId: activeItem?.type === 'analysis' ? activeItem.data.id : null,
              audioUrl: t.audioUrl,
              imageUrl: t.imageUrl || null,
              sunoTaskId: taskIdV1,
              genre: activeItem?.type === 'analysis' ? activeItem.data.genre : 'pop',
              originalTitle: activeItem?.type === 'analysis' ? activeItem.data.title : null,
              remixTitle: t.label,
            }),
          });
          if (!saveRes.ok) {
            const errText = await saveRes.text();
            console.error('save-remix failed:', saveRes.status, errText);
          }
        } catch (saveErr) {
          console.error('save-remix error:', saveErr);
        }
      }
      if (user) clearPendingGeneration(user.id);
      // â Save lyrics to localStorage for each generated track (persists across sessions)
      if (createLyrics && taskIdV1) {
        saveLyricsForTrack(taskIdV1, createLyrics);
        if (taskIdV2) saveLyricsForTrack(taskIdV2, createLyrics);
      }
      // â Deduct credits AFTER successful generation
      if (user && tracks.length > 0) {
        const deductResult = await deductCredits(user.id, CREDIT_COSTS.viral);
        if (deductResult.success) {
          await refreshProfile(); // update credits display
        }
      }
      await loadData(); setGenerating(false); setCreateFile(null);
      // Play first track
      if (tracks[0]?.audioUrl) playTrackWithTracking({ id: `remix_new_${Date.now()}`, title: tracks[0].label, audioUrl: tracks[0].audioUrl });
      toast.success(`ð ${tracks.length} Algorithm Hit${tracks.length > 1 ? 's' : ''} ready! ${CREDIT_COSTS.viral} credits used`); setTab('created');
      setJustGenerated(true); setTimeout(() => setJustGenerated(false), 15000);
    } catch (e: any) {
      clearInterval(generateTimerRef.current); setGenerating(false);
      toast.error(e.message || 'Generation failed');
    }
  };

  /* âââ ENHANCE LYRICS âââ */
  const handleEnhanceLyrics = async () => {
    if (!enhanceLyricsPrompt.trim()) return;
    setEnhancingLyrics(true);
    try {
      const res = await fetch(LAMBDA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enhance-lyrics', lyrics: createLyrics, instruction: enhanceLyricsPrompt }),
      });
      const data = await res.json();
      if (data.enhanced || data.lyrics) {
        setCreateLyrics(data.enhanced || data.lyrics);
        setEnhanceLyricsPrompt('');
        toast.success('â¨ Lyrics enhanced!');
      } else {
        // Graceful client-side fallback: just append the instruction as a note
        setCreateLyrics(prev => prev + `\n\n[Style note: ${enhanceLyricsPrompt}]`);
        setEnhanceLyricsPrompt('');
        toast.success('Style note added to lyrics');
      }
    } catch {
      // Graceful fallback
      setCreateLyrics(prev => prev + `\n\n[Style note: ${enhanceLyricsPrompt}]`);
      setEnhanceLyricsPrompt('');
      toast.success('Style note added to lyrics');
    } finally {
      setEnhancingLyrics(false);
    }
  };

  /* âââ Play with tracking âââ */
  const playTrackWithTracking = (track: { id: string; title: string; audioUrl: string }) => {
    // Only increment play count when starting a NEW track (not resuming same track)
    const isNewTrack = !currentTrack || currentTrack.audioUrl !== track.audioUrl;
    if (user && isNewTrack) {
      incrementPlayCount(user.id, track.id);
      setPlayCounts(prev => ({ ...prev, [track.id]: (prev[track.id] || 0) + 1 }));
    }
    playTrack(track);
  };

  /* âââ REACTION handler âââ */
  const handleReaction = (itemId: string, emoji: string) => {
    setReactions(prev => {
      const item = prev[itemId] || {};
      return { ...prev, [itemId]: { ...item, [emoji]: (item[emoji] || 0) + 1 } };
    });
  };

  /* âââ PUBLISH handler âââ */
  const handlePublish = async (item: SongItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type !== 'remix') return;
    try {
      await supabase.from('viralize_remixes').update({ status: 'public' }).eq('id', item.data.id);
      toast.success('ð Song published!', { duration: 2000 });
    } catch {
      toast.error('Failed to publish');
    }
  };

  /* âââ SCORE badge âââ */
  const scoreBadge = (score: number) => {
    if (score >= 80) return 'bg-primary/20 text-primary border-primary/30';
    if (score >= 65) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (score >= 40) return 'bg-accent/20 text-accent border-accent/30';
    return 'bg-destructive/20 text-destructive border-destructive/30';
  };

  /* âââ Currently playing âââ */
  const activeAudioUrl = activeItem?.type === 'remix' ? activeItem.data.audio_url
    : activeItem?.type === 'analysis' ? (activeItem.data.audio_url || '') : '';
  const isActiveItemPlaying = currentTrack && activeAudioUrl && currentTrack.audioUrl === activeAudioUrl && isPlaying;

  if (!user) return null;

  /* ââââââââââââââââââââââââââââââââââââââââ
     RIGHT PANEL CONTENT
  ââââââââââââââââââââââââââââââââââââââââ */
  const RightPanel = () => {
    if (!activeItem) return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-3 opacity-40">
        <Music2 className="w-10 h-10 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">Select a song</p>
      </div>
    );

    const title = getTitle(activeItem);
    const styleText = getStyleTags(activeItem);
    const isLiked = likes.has(activeItem.data.id);
    const audioUrl = activeItem.type === 'remix' ? activeItem.data.audio_url
      : (activeItem.data.audio_url || '');
    const imageUrl = activeItem.type === 'remix' ? (activeItem.data.image_url || '') : (activeItem.data.thumbnail_url || '');
    const r = activeItem.type === 'analysis' ? (activeItem.data.full_result || {}) : {};

    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Title + actions */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-bold text-foreground leading-snug flex-1">{title}</h3>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={e => handleLike(activeItem.data.id, e)}
                className={`p-1.5 rounded-lg transition-colors ${isLiked ? 'text-red-400 bg-red-400/10' : 'text-muted-foreground hover:text-red-400 hover:bg-red-400/10'}`}>
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              {audioUrl && (
                <a href={audioUrl} download={`${title}.mp3`}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                  <Download className="w-4 h-4" />
                </a>
              )}
              <button onClick={e => handleShare(activeItem, e)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                {copiedId === activeItem.data.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Add Viral Implement â auto-fills Create with optimal values */}
          {activeItem.type === 'analysis' && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const r = activeItem.data.full_result || {};
                // Auto-fill style with the optimal viral parameters from analysis
                const viralStyle: string[] = [];
                if (activeItem.data.genre) viralStyle.push(activeItem.data.genre.toLowerCase());
                if (r.bpmEstimate) viralStyle.push(r.bpmEstimate.toLowerCase());
                if (r.musicalKey) viralStyle.push(r.musicalKey.toLowerCase());
                if (r.dominantInstrument) viralStyle.push(r.dominantInstrument.toLowerCase());
                if (r.drumPattern) viralStyle.push(r.drumPattern.split(',')[0].toLowerCase());
                if (r.productionEra) viralStyle.push(r.productionEra.toLowerCase());
                if (r.emotionalCore) viralStyle.push(r.emotionalCore.toLowerCase());
                // Add viral tags from the improvement fix
                if (r.oneChange) viralStyle.push('hook-forward');
                setCreateStyle(viralStyle.slice(0, 6).join(', '));
                // Auto-fill lyrics with AI-improved version
                if (r.improvedLyrics) setCreateLyrics(r.improvedLyrics);
                else if (r.originalLyrics) setCreateLyrics(r.originalLyrics);
                setLeftMode('create');
                setCreateFile(null);
                toast.success('â¨ Viral parameters loaded â upload your audio to create!');
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-black font-bold text-xs flex items-center justify-center gap-2 mt-2 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" /> Add Viral Implement
            </motion.button>
          )}

          {/* Remix/Edit for created songs */}
          {activeItem.type === 'remix' && (
            <Button
              onClick={() => { setLeftMode('create'); setCreateFile(null); }}
              size="sm"
              className="w-full h-8 rounded-xl bg-muted hover:bg-muted/70 text-foreground font-semibold text-xs border border-border gap-1.5 mt-2"
              variant="outline"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Remix Again
            </Button>
          )}
          {/* Play count row */}
          {(playCounts[activeItem?.data.id || ''] || 0) > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
              <Play className="w-3 h-3" />
              Played {playCounts[activeItem.data.id]}Ã by you
            </div>
          )}
        </div>

        {/* Style tags */}
        {styleText && (
          <div className="px-4 py-2 shrink-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Style</p>
            <div className="flex flex-wrap gap-1.5">
              {styleText.split(',').filter(Boolean).slice(0, 8).map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4">

          {/* Score + badges for analyses */}
          {activeItem.type === 'analysis' && (
            <div className="space-y-2">
              <div className="rounded-xl border border-border bg-card/50 p-3 flex items-center gap-3">
                <div className={`text-3xl font-black ${activeItem.data.score >= 80 ? 'text-primary' : activeItem.data.score >= 65 ? 'text-emerald-400' : activeItem.data.score >= 40 ? 'text-accent' : 'text-destructive'}`}>
                  {activeItem.data.score}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">Viral Score</p>
                  <p className="text-xs text-foreground/80 leading-snug mt-0.5 line-clamp-2">
                    {r.verdict || activeItem.data.verdict || 'â'}
                  </p>
                </div>
              </div>
              {/* BPM / Key / Score badges row */}
              {(r.bpmEstimate || r.musicalKey || activeItem.data.genre) && (
                <div className="flex flex-wrap gap-1.5">
                  {r.bpmEstimate && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold">
                      {r.bpmEstimate}
                    </span>
                  )}
                  {r.musicalKey && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold">
                      {r.musicalKey}
                    </span>
                  )}
                  {activeItem.data.genre && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-bold">
                      {activeItem.data.genre}
                    </span>
                  )}
                </div>
              )}
              {/* Remix this button */}
              <button
                onClick={() => {
                  const fr = activeItem.data.full_result || {};
                  const viralStyle: string[] = [];
                  if (activeItem.data.genre) viralStyle.push(activeItem.data.genre.toLowerCase());
                  if (fr.bpmEstimate) viralStyle.push(fr.bpmEstimate.toLowerCase());
                  if (fr.musicalKey) viralStyle.push(fr.musicalKey.toLowerCase());
                  setCreateStyle(viralStyle.slice(0, 4).join(', '));
                  if (fr.improvedLyrics) setCreateLyrics(fr.improvedLyrics);
                  setLeftMode('create');
                }}
                className="w-full py-2 rounded-xl border border-dashed border-primary/30 text-primary text-[11px] font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> â¡ Create Algorithm Hit
              </button>
            </div>
          )}

          {/* Reaction emojis */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Reactions</p>
            <div className="flex flex-wrap gap-1.5">
              {['ð¥', 'ð', 'ð±', 'ð', 'ð', 'ð', 'ð¢'].map(emoji => {
                const count = reactions[activeItem.data.id]?.[emoji] || 0;
                return (
                  <button key={emoji}
                    onClick={() => handleReaction(activeItem.data.id, emoji)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] transition-all ${
                      count > 0
                        ? 'bg-primary/10 border-primary/30 text-foreground'
                        : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/20 hover:bg-primary/5'
                    }`}>
                    <span>{emoji}</span>
                    {count > 0 && <span className="text-[9px] font-bold text-primary">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* "Algorithm Hit based on" â for remixes (like Suno's "Cover of") */}
          {activeItem.type === 'remix' && activeItem.data.original_title && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Algorithm Hit based on</p>
                <p className="text-xs font-semibold text-foreground truncate">{activeItem.data.original_title}</p>
              </div>
              {/* Score progression if original analysis exists */}
              {(() => {
                const orig = analyses.find(a => a.id === activeItem.data.analysis_id);
                if (!orig) return null;
                return (
                  <div className="text-right shrink-0">
                    <p className="text-[9px] text-muted-foreground">Score</p>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground/50 line-through">{orig.score}</span>
                      <span className="text-[10px] text-emerald-400 font-black">â Hit â¡</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Lyrics â analyses AND remixes */}
          {/* For remixes: show the lyrics that were used to generate */}
          {activeItem.type === 'remix' && activeItem.data.suno_task_id && (() => {
            // Load lyrics from localStorage (persists across sessions)
            const savedLyrics = loadLyricsForTrack(activeItem.data.suno_task_id);
            const displayLyrics = savedLyrics || createLyrics;
            if (!displayLyrics) return null;
            return (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lyrics</p>
                  <div className="flex gap-1">
                    <button onClick={() => navigator.clipboard.writeText(displayLyrics)}
                      className="text-[9px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                      <Copy className="w-2.5 h-2.5" /> Copy
                    </button>
                    <button onClick={() => { setCreateLyrics(displayLyrics); setLeftMode('create'); }}
                      className="text-[9px] px-1.5 py-0.5 rounded border border-primary/30 text-primary hover:bg-primary/10 flex items-center gap-0.5">
                      <Sparkles className="w-2 h-2" /> Edit
                    </button>
                  </div>
                </div>
                {/* Suno-style full scrollable lyrics with section markers */}
                <div className="font-mono text-[11px] leading-relaxed overflow-y-auto bg-muted/20 rounded-xl p-3 border border-border"
                  style={{ maxHeight: '40vh' }}>
                  {displayLyrics.split('\n').map((line: string, idx: number) => {
                    const isSection = /^\[.+\]$/.test(line.trim());
                    return (
                      <div key={idx} className={isSection
                        ? 'text-primary font-black text-[10px] uppercase tracking-wider mt-3 mb-1 first:mt-0'
                        : 'text-foreground/80'}>
                        {line || '\u00A0'}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Lyrics â with section markers */}
          {(r.originalLyrics || r.improvedLyrics) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lyrics</p>
                <div className="flex gap-1">
                  <button onClick={() => navigator.clipboard.writeText(r.improvedLyrics || r.originalLyrics)}
                    className="text-[9px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                    <Copy className="w-2.5 h-2.5" /> Copy
                  </button>
                  {r.originalLyrics && (
                    <button onClick={() => setCreateLyrics(r.originalLyrics)}
                      className="text-[9px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground">
                      Use
                    </button>
                  )}
                  {r.improvedLyrics && (
                    <button onClick={() => setCreateLyrics(r.improvedLyrics)}
                      className="text-[9px] px-1.5 py-0.5 rounded border border-primary/30 text-primary hover:bg-primary/10 flex items-center gap-0.5">
                      <Sparkles className="w-2 h-2" /> AI â
                    </button>
                  )}
                </div>
              </div>
              {/* Suno-style: full scrollable, no max-height cap, section markers colored */}
              <div className="font-mono text-[11px] leading-relaxed overflow-y-auto bg-muted/20 rounded-xl p-3 border border-border"
                style={{ maxHeight: '45vh' }}>
                {(r.improvedLyrics || r.originalLyrics).split('\n').map((line: string, idx: number) => {
                  const isSection = /^\[.+\]$/.test(line.trim());
                  return (
                    <div key={idx} className={isSection
                      ? 'text-primary font-black text-[10px] uppercase tracking-wider mt-3 mb-1 first:mt-0'
                      : 'text-foreground/80'}>
                      {line || '\u00A0'}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Key insights */}
          {activeItem.type === 'analysis' && (r.improvements?.length || r.strengths?.length) && (
            <div className="space-y-2">
              {r.improvements?.slice(0, 2).map((imp: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2.5 rounded-lg bg-destructive/5 border border-destructive/15">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                  <span className="text-foreground/70 leading-snug">{imp}</span>
                </div>
              ))}
              {r.strengths?.slice(0, 1).map((s: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-foreground/70 leading-snug">{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* Analysis link */}
          {activeItem.type === 'analysis' && (
            <Link to={`/song/${activeItem.data.id}`}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors text-xs">
              <span className="font-medium text-foreground">Full Analysis Report</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>
          )}
        </div>
      </div>
    );
  };

  /* ââââââââââââââââââââââââââââââââââââââââ
     RENDER
  ââââââââââââââââââââââââââââââââââââââââ */
  return (
    <DashboardLayout noPlayerPadding>
      {/* Credits Modal */}
      {showCreditsModal && (
        <CreditsModal
          onClose={() => setShowCreditsModal(false)}
          onBuy={handleBuyCreditsModal}
          loading={creditsModalLoading}
        />
      )}
      <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
        {/* 3-column row â LEFT | CENTER | RIGHT */}
        <div className="flex flex-1 overflow-hidden min-h-0">

        {/* âââââââââââââââââââââââââââââââ
            LEFT â Audio + Create Panel
            Desktop: fixed 260px column
            Mobile: full-screen overlay when mobileView === 'create'
        âââââââââââââââââââââââââââââââ */}
        {/* Mobile backdrop â tap outside create panel to close */}
        {mobileView === 'create' && (
          <div className="fixed inset-0 z-10 bg-black/50 lg:hidden" onClick={() => setMobileView('feed')} />
        )}
        {/* Mobile backdrop â tap outside detail panel to close */}
        {mobileView === 'detail' && (
          <div className="fixed inset-0 z-10 bg-black/50 xl:hidden" onClick={() => setMobileView('feed')} />
        )}

        <div className={`shrink-0 border-r border-border/40 bg-background flex flex-col overflow-hidden
          lg:w-[260px] xl:w-[280px]
          ${mobileView === 'create' ? 'flex w-full absolute inset-0 z-20' : 'hidden lg:flex'}`}>

          {/* Mobile close button */}
          {mobileView === 'create' && (
            <div className="flex items-center justify-between px-3 pt-3 pb-1 lg:hidden shrink-0">
              <p className="text-xs font-bold text-foreground">Create</p>
              <button onClick={() => setMobileView('feed')} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step indicator */}
          <div className="flex items-center gap-1 px-3 pt-2 pb-1">
            <div className={`flex items-center gap-1 text-[9px] font-bold ${leftMode === 'analyze' ? 'text-primary' : 'text-muted-foreground/40'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${leftMode === 'analyze' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>1</span>
              Scan
            </div>
            <div className={`w-6 h-px ${(lastAnalysisResult || activeItem) ? 'bg-primary' : 'bg-border'}`} />
            <div className={`flex items-center gap-1 text-[9px] font-bold ${leftMode === 'create' ? 'text-orange-400' : 'text-muted-foreground/40'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${leftMode === 'create' ? 'bg-orange-500 text-black' : 'bg-muted text-muted-foreground'}`}>2</span>
              Hit
            </div>
          </div>

          {/* Mode tabs */}
          <div className="px-3 pt-1 pb-2 shrink-0">
            <div className="flex p-1 bg-muted/50 rounded-xl gap-1 shrink-0">
              {(['analyze', 'create'] as const).map(m => (
                <button key={m} onClick={() => setLeftMode(m)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    leftMode === m
                      ? m === 'analyze'
                        ? 'bg-primary/20 text-primary shadow-sm'
                        : 'bg-orange-500/20 text-orange-400 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}>
                  {m === 'analyze'
                    ? <><Search className="w-3 h-3" />Scan</>
                    : <><Sparkles className="w-3 h-3" />Algorithm Hit</>}
                </button>
              ))}
            </div>
          </div>

          {/* ââ ANALYZE ââ */}
          {leftMode === 'analyze' && (
            <div className="flex-1 overflow-y-auto px-3 pb-20 space-y-3">
              {analyzing ? (
                <ScanLoadingPanel elapsed={analyzeElapsed} step={analyzeStep} />
              ) : lastAnalysisResult ? (
                /* ââ Analysis Results ââ */
                <div className="space-y-3">
                  {/* Song title at top */}
                  <p className="text-xs font-bold text-foreground truncate mb-3">
                    ð {lastAnalysisResult.dbRecord?.title || lastAnalysisResult.title || songTitle || 'Your Song'}
                  </p>
                  {/* Score card */}
                  <div className={`rounded-2xl p-4 text-center border ${
                    lastAnalysisResult.score >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' :
                    lastAnalysisResult.score >= 60 ? 'bg-primary/10 border-primary/30' :
                    lastAnalysisResult.score >= 40 ? 'bg-amber-500/10 border-amber-500/30' :
                    'bg-destructive/10 border-destructive/30'
                  }`}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Viral Score</p>
                    <p className={`text-5xl font-black ${
                      lastAnalysisResult.score >= 80 ? 'text-emerald-400' :
                      lastAnalysisResult.score >= 60 ? 'text-primary' :
                      lastAnalysisResult.score >= 40 ? 'text-amber-400' : 'text-destructive'
                    }`}>{lastAnalysisResult.score}<span className="text-xl text-muted-foreground">/100</span></p>
                    <p className="text-xs text-foreground/80 mt-1 font-semibold">{lastAnalysisResult.verdict || ''}</p>
                  </div>

                  {/* Key metrics */}
                  {(lastAnalysisResult.bpmEstimate || lastAnalysisResult.musicalKey) && (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'BPM', value: lastAnalysisResult.bpmEstimate || 'â' },
                        { label: 'Key', value: lastAnalysisResult.musicalKey || 'â' },
                        { label: 'Genre', value: lastAnalysisResult.genre || 'â' },
                      ].map(m => (
                        <div key={m.label} className="rounded-xl bg-muted/40 border border-border/60 p-2 text-center">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                          <p className="text-xs font-bold text-foreground truncate">{m.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hook timing */}
                  {lastAnalysisResult.hookTiming && lastAnalysisResult.hookTiming !== 'unknown' && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/40">
                      <span className="text-[10px] text-muted-foreground">ð£ Hook at</span>
                      <span className="text-xs font-bold text-foreground">{lastAnalysisResult.hookTiming}</span>
                      {lastAnalysisResult.viralLine && (
                        <span className="text-[10px] text-primary/70 truncate ml-auto">"{lastAnalysisResult.viralLine}"</span>
                      )}
                    </div>
                  )}

                  {/* Transcribed lyrics preview */}
                  {lastAnalysisResult.originalLyrics && (
                    <div className="rounded-xl bg-muted/20 border border-border/40 p-3">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1.5">Transcribed Lyrics â</p>
                      <p className="text-[11px] text-foreground/70 font-mono leading-relaxed line-clamp-3">
                        {lastAnalysisResult.originalLyrics}
                      </p>
                    </div>
                  )}

                  {/* Improvements */}
                  {lastAnalysisResult.improvements?.length > 0 && (
                    <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider mb-2">What to improve</p>
                      <ul className="space-y-1.5">
                        {lastAnalysisResult.improvements.slice(0, 3).map((imp: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-400 mt-0.5 shrink-0">â¸</span>
                            <span className="text-[11px] text-foreground/80 leading-snug">{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Strengths */}
                  {lastAnalysisResult.strengths?.length > 0 && (
                    <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider mb-2">Strengths</p>
                      <ul className="space-y-1.5">
                        {lastAnalysisResult.strengths.slice(0, 2).map((s: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 mt-0.5 shrink-0">â</span>
                            <span className="text-[11px] text-foreground/80 leading-snug">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* DNA Breakdown */}
                  {lastAnalysisResult.dna?.length > 0 && (
                    <div className="rounded-xl bg-muted/20 border border-border/40 p-3">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">ð§¬ DNA Breakdown</p>
                      <div className="space-y-1.5">
                        {lastAnalysisResult.dna.map((d: { label: string; value: number; max: number }) => (
                          <div key={d.label} className="flex items-center gap-2">
                            <span className="text-[9px] text-muted-foreground w-24 shrink-0 truncate">{d.label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${(d.value / d.max) * 100}%` }} />
                            </div>
                            <span className="text-[9px] text-foreground font-bold w-5 text-right shrink-0">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Similar Hits */}
                  {lastAnalysisResult.similarHits?.length > 0 && (
                    <div className="rounded-xl bg-muted/20 border border-border/40 p-3">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">ð¯ Similar Hits</p>
                      <div className="flex flex-wrap gap-1.5">
                        {lastAnalysisResult.similarHits.map((h: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">{h}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA â Create Algorithm Hit (transfers ALL data from scan) */}
                  <motion.button
                    onClick={() => {
                      // Transfer analysis data â Create panel
                      const r = lastAnalysisResult;
                      // Auto-fill lyrics from analysis
                      if (r.improvedLyrics) setCreateLyrics(r.improvedLyrics);
                      else if (r.originalLyrics) setCreateLyrics(r.originalLyrics);
                      // Auto-fill style from analysis
                      const viralStyle = [
                        r.genre || '',
                        r.bpmEstimate ? `${r.bpmEstimate}bpm` : '',
                        r.musicalKey || '',
                        ...(r.tags || []),
                      ].filter(Boolean);
                      if (viralStyle.length) setCreateStyle(viralStyle.slice(0, 5).join(', '));
                      // Keep s3Key from scan â so no re-upload needed
                      // (lastScanS3Key is already set, handleCreate uses it via activeItem or lastScanS3Key)
                      setLastAnalysisResult(null);
                      setLeftMode('create');
                    }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:opacity-90 transition-all relative overflow-hidden"
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                    <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} />
                    <Sparkles className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">â¡ Create Algorithm Hit â</span>
                  </motion.button>

                  {/* Re-analyze / View full report */}
                  <div className="flex gap-2">
                    <button onClick={() => setLastAnalysisResult(null)}
                      className="flex-1 py-2 rounded-xl text-[11px] font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 transition-all">
                      â Analyze another
                    </button>
                    {lastAnalysisResult.dbRecord?.id && (
                      <Link to={`/song/${lastAnalysisResult.dbRecord.id}`}
                        className="flex-1 py-2 rounded-xl text-[11px] font-semibold text-primary border border-primary/30 hover:bg-primary/5 transition-all text-center">
                        Full report â
                      </Link>
                    )}
                  </div>
                </div>
                ) : null}
                {/* Main create form — always shown when canCreate && !generating */}
                {(activeItem || createFile || lastScanS3Key) && (
                <>
                  {/* Drop zone */}
                  <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) acceptFile(e.dataTransfer.files[0], 'analyze'); }}
                    onClick={() => !uploadFile && pickFile('analyze')}
                    className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all p-4 text-center ${dragOver ? 'border-primary bg-primary/10 scale-[1.01]' : uploadFile ? 'border-accent/40 bg-accent/5' : 'border-border hover:border-primary/40 hover:bg-primary/5'}`}>
                    {uploadFile ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Music2 className="w-4 h-4 text-accent shrink-0" />
                            <span className="text-xs font-medium text-foreground truncate">{uploadFile.name}</span>
                          </div>
                          <button onClick={e => { e.stopPropagation(); setUploadFile(null); }} className="text-muted-foreground hover:text-foreground ml-1">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* Static waveform preview */}
                        <div className="flex items-end gap-[1.5px] h-10 px-1">
                          {Array.from({ length: 40 }).map((_, i) => (
                            <div key={i} className="flex-1 rounded-full bg-accent/40"
                              style={{ height: `${20 + Math.abs(Math.sin(i * 0.5)) * 65 + 15}%` }} />
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground">{(uploadFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    ) : (
                      <div className="space-y-2 py-3">
                        <Upload className="w-7 h-7 text-muted-foreground/50 mx-auto" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">Drop your track</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">MP3 or WAV Â· max 100MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <input value={songTitle} onChange={e => setSongTitle(e.target.value)} placeholder="Song title (optional)"
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors" />
                  {/* Genre pills */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Genre <span className="font-normal normal-case opacity-60">(optional)</span></p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Pop','Hip-Hop','R&B','Rap','EDM','Rock','Latin','Afrobeats','Country','Indie','Drill','Trap'].map(g => (
                        <button key={g} type="button"
                          onClick={() => setSongGenre(songGenre === g ? '' : g)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all border ${
                            songGenre === g
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                          }`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleAnalyze} disabled={!uploadFile}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-xl text-sm font-bold gap-2 disabled:opacity-40 h-10">
                    <Search className="w-4 h-4" /> Scan My Song
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground">Uses {CREDIT_COSTS.analysis} credits</p>
                </>
              )}
            </div>
          )}

          {/* ââ CREATE ââ */}
          {leftMode === 'create' && (
            <div className="flex-1 overflow-y-auto px-3 pb-20 space-y-2.5">
              {!canCreate ? (
                <UpgradeGate />
              ) : generating ? (
                <ViralCreatePanel elapsed={generateElapsed} genre={activeItem?.type === 'analysis' ? activeItem.data.genre : 'pop'} />
              ) : (
                <>
                {/* Getting started guidance â shown when no audio source selected */}
                {!activeItem && !createFile && !lastScanS3Key && (
                <div className="flex flex-col items-center px-4 text-center space-y-3 py-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Sparkles className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-foreground">Create Your Algorithm Hit</h3>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      Select a song from your library, scan a new one, or upload audio.
                    </p>
                  </div>
                  <div className="space-y-2 w-full">
                    <button onClick={() => setLeftMode('analyze')}
                      className="w-full py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/15 transition-all flex items-center justify-center gap-2">
                      <Search className="w-3.5 h-3.5" />
                      Scan a new song first
                    </button>
                    <button onClick={() => pickFile('create')}
                      className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-muted-foreground text-xs hover:text-foreground hover:border-white/20 transition-all flex items-center justify-center gap-2">
                      <Upload className="w-3.5 h-3.5" />
                      Upload audio directly
                    </button>
                  </div>
                </div>
                )}
                {/* Main create form â always shown when canCreate && !generating */}
                {(activeItem || createFile || lastScanS3Key) && (
                <>
                  {/* Quality selector */}
                  <div className="flex items-center gap-1 pt-0.5">
                    <span className="text-[10px] text-muted-foreground font-semibold shrink-0">Quality</span>
                    <div className="flex gap-0.5 bg-muted/40 rounded-lg p-0.5 ml-1">
                      {([['v5', 'Ultra HD'], ['v4.5', 'Standard']] as const).map(([val, label]) => (
                        <button key={val} onClick={() => setSunoVersion(val)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                            sunoVersion === val
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Dynamic: show selected song OR prompt to select */}
                  {activeItem ? (
                    <div className={`rounded-xl border p-3 space-y-2 ${
                      activeItem.type === 'analysis' ? 'border-primary/25 bg-primary/5' : 'border-accent/25 bg-accent/5'
                    }`}>
                      {/* Art + title + score */}
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${artGradient(activeItem.data.id)} flex items-center justify-center shrink-0 overflow-hidden`}>
                          {(activeItem.type === 'remix' ? activeItem.data.image_url : activeItem.data.thumbnail_url)
                            ? <img src={(activeItem.type === 'remix' ? activeItem.data.image_url : activeItem.data.thumbnail_url) || ''} alt="" className="w-full h-full object-cover" />
                            : <Music2 className="w-4 h-4 text-white/30" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{getTitle(activeItem)}</p>
                          <p className="text-[10px] text-muted-foreground">{activeItem.data.genre || 'Unknown genre'}</p>
                        </div>
                        {activeItem.type === 'analysis' && (
                          <Badge className={`${scoreBadge(activeItem.data.score)} border text-[9px] font-bold shrink-0`}>{activeItem.data.score}</Badge>
                        )}
                      </div>
                      {/* Live waveform of selected song */}
                      <div className="flex items-end gap-[1px] h-7 w-full">
                        {Array.from({ length: 60 }).map((_, i) => (
                          <div key={i} className={`flex-1 rounded-full ${activeItem.type === 'analysis' ? 'bg-primary/40' : 'bg-accent/40'}`}
                            style={{ height: `${12 + Math.abs(Math.sin(i * 0.35 + activeItem.data.id.charCodeAt(i % activeItem.data.id.length) * 0.1)) * 75}%` }} />
                        ))}
                      </div>
                      {/* Key info strip */}
                      {activeItem.type === 'analysis' && (activeItem.data.full_result?.bpmEstimate || activeItem.data.full_result?.musicalKey) && (
                        <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                          {activeItem.data.full_result?.bpmEstimate && <span className="px-1.5 py-0.5 rounded bg-muted border border-border">{activeItem.data.full_result.bpmEstimate}</span>}
                          {activeItem.data.full_result?.musicalKey && <span className="px-1.5 py-0.5 rounded bg-muted border border-border">{activeItem.data.full_result.musicalKey}</span>}
                          {activeItem.data.full_result?.hookTiming && <span className="px-1.5 py-0.5 rounded bg-muted border border-border">Hook: {activeItem.data.full_result.hookTiming}</span>}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                      â Select a song from the feed to remix it
                    </div>
                  )}

                  {/* Audio zone â smart status display */}
                  {(() => {
                    // Check all possible audio sources (priority order)
                    const anyUrl =
                      (activeItem?.type === 'analysis' ? activeItem.data.audio_url : null) ||
                      (activeItem?.type === 'remix' ? activeItem.data.audio_url : null);
                    const s3Key = anyUrl ? extractS3Key(anyUrl) : lastScanS3Key;
                    const audioLabel = activeItem
                      ? (activeItem.type === 'analysis' ? activeItem.data.title : (activeItem.data.remix_title || activeItem.data.title))
                      : (lastScanS3Key ? 'Audio from your last scan' : '');

                    // Has S3 key (from selected item OR from last scan) â ready
                    if (s3Key && !createFile) {
                      return (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-emerald-400">Audio ready â</p>
                            <p className="text-[9px] text-muted-foreground truncate">{audioLabel}</p>
                          </div>
                          <button onClick={() => { setLastScanS3Key(null); pickFile('create'); }} className="text-[9px] text-muted-foreground hover:text-foreground shrink-0">replace</button>
                        </div>
                      );
                    }

                    // Has uploaded file â show it
                    if (createFile) {
                      return (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/5 border border-accent/30">
                          <Music2 className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="text-xs text-foreground truncate flex-1">{createFile.name}</span>
                          <button onClick={() => setCreateFile(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    }

                    // activeItem selected but no audio URL (most common case for older analyses)
                    // Show upload prompt â informative but not blocking
                    return (
                      <div onClick={() => pickFile('create')}
                        className="cursor-pointer rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors p-2.5">
                        {activeItem ? (
                          <div className="flex items-center gap-2">
                            <Upload className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold text-amber-400">Upload audio file to continue</p>
                              <p className="text-[9px] text-muted-foreground">Lyrics & style from "{activeItem.type === 'analysis' ? activeItem.data.title : (activeItem.data.remix_title || 'song')}" are ready</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Upload className="w-3.5 h-3.5" />
                            <span className="text-xs">Upload audio file or select a track</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Lyrics section */}
                  <div>
                    <button onClick={() => setLyricsExpanded(!lyricsExpanded)}
                      className="flex items-center justify-between w-full py-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Mic2 className="w-3 h-3" /> Lyrics
                        {createLyrics && lastScanS3Key && (
                          <span className="text-[9px] text-emerald-400 font-bold">â imported from scan</span>
                        )}
                      </span>
                      <div className="flex items-center gap-1">
                        <button className="text-muted-foreground hover:text-foreground p-0.5 rounded">
                          <Sparkles className="w-3 h-3" />
                        </button>
                        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${lyricsExpanded ? '' : '-rotate-90'}`} />
                      </div>
                    </button>
                    {lyricsExpanded && (
                      <div className="mt-1 space-y-1.5">
                        <textarea value={createLyrics} onChange={e => setCreateLyrics(e.target.value)}
                          placeholder="Write some lyrics or a prompt â or leave blank for instrumental"
                          className="w-full h-28 bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 transition-colors font-mono leading-relaxed" />
                        {/* Enhance lyrics */}
                        <div className="flex gap-1">
                          <div className="relative flex-1">
                            <Sparkles className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
                            <input
                              value={enhanceLyricsPrompt}
                              onChange={e => setEnhanceLyricsPrompt(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleEnhanceLyrics(); }}
                              placeholder="make it sound happier, more energeticâ¦"
                              className="w-full bg-muted/30 border border-border rounded-lg pl-6 pr-2 py-1.5 text-[10px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-colors"
                            />
                          </div>
                          <button
                            onClick={handleEnhanceLyrics}
                            disabled={!enhanceLyricsPrompt.trim() || enhancingLyrics}
                            className="px-2 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-[10px] font-bold transition-all disabled:opacity-40 shrink-0 flex items-center gap-1">
                            {enhancingLyrics ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Styles section */}
                  <div>
                    <div className="flex items-center justify-between">
                      <button onClick={() => setStylesExpanded(!stylesExpanded)}
                        className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-1">
                        <span>Styles</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${stylesExpanded ? '' : '-rotate-90'}`} />
                      </button>
                      <div className="flex gap-1">
                        <button onClick={() => setCreateStyle('')} className="p-1 rounded text-muted-foreground hover:text-foreground" title="Clear">
                          <RotateCcw className="w-3 h-3" />
                        </button>
                        <button onClick={() => setShowStyleSuggestions(!showStyleSuggestions)} className="p-1 rounded text-muted-foreground hover:text-foreground" title="Suggestions">
                          <Bookmark className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {stylesExpanded && (
                      <div className="mt-1 space-y-2">
                        <textarea value={createStyle} onChange={e => setCreateStyle(e.target.value)}
                          placeholder="afro soul, chill, afrobeat, 120 BPM, minor keyâ¦"
                          rows={2}
                          className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 transition-colors font-mono" />
                        {/* Viral style chips â shuffleable */}
                        <div className="flex flex-wrap gap-1.5">
                          {shownChips.map(chip => (
                            <button key={chip}
                              onClick={() => setCreateStyle(s => s ? `${s}, ${chip}` : chip)}
                              className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all">
                              {chip}
                            </button>
                          ))}
                          <button
                            onClick={() => setShownChips(shuffleArray(VIRAL_STYLE_CHIPS).slice(0, 10))}
                            className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground transition-all"
                            title="Shuffle suggestions">
                            ð
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
                )}

                  {/* CREATE button â always visible (disabled when no audio source) */}
                  {(() => {
                    const _canClick = !!activeItem || !!createFile || !!lastScanS3Key;
                    return (
                  <motion.button onClick={handleCreate} disabled={!_canClick}
                    whileHover={_canClick ? { scale: 1.01 } : {}}
                    whileTap={_canClick ? { scale: 0.98 } : {}}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-black font-bold text-sm flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 mt-1">
                    <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} />
                    <Sparkles className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">
                      {_canClick ? 'Create Algorithm Hit' : 'Select a track or upload audio'}
                    </span>
                  </motion.button>
                  );
                  })()}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Uses {CREDIT_COSTS.viral} credits Â· {credits} remaining</span>
                    <button onClick={() => setShowCreditsModal(true)} className="text-primary hover:underline font-semibold">+ Buy credits</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* âââââââââââââââââââââââââââââââ
            CENTER â Song Feed
        âââââââââââââââââââââââââââââââ */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 border-r border-border/40">

          {/* Data credibility strip */}
          <div className="px-4 py-1.5 bg-primary/5 border-b border-primary/10 flex items-center gap-2 shrink-0">
            <Zap className="w-3 h-3 text-primary shrink-0" />
            <p className="text-[10px] text-primary/70 font-medium truncate">
              Powered by <strong>500M+ songs</strong> â Spotify Â· Apple Music Â· Deezer Â· YouTube live data
            </p>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border/40 shrink-0">
            {([
              { id: 'all', label: `All (${analyses.length + remixes.length})` },
              { id: 'liked', label: 'â¤ Liked' },
              { id: 'uploads', label: `ð Scanned (${analyses.length})` },
              { id: 'created', label: `â¡ My Hits (${remixes.length})` },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id as CenterTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === t.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                {t.label}
                {t.id === 'liked' && likes.size > 0 && (
                  <span className="ml-1 text-red-400">{likes.size}</span>
                )}
              </button>
            ))}
            <div className="flex-1" />
            <input
              value={feedSearch}
              onChange={e => setFeedSearch(e.target.value)}
              placeholder="Search songs..."
              className="flex-none w-[120px] bg-muted/40 border border-border/60 rounded-lg px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
            />
            <Link to="/analyze"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
              <Upload className="w-3.5 h-3.5" /> Upload
            </Link>
          </div>

          {/* Feed */}
          <div className="flex-1 overflow-y-auto pb-20">
            {/* Generating progress card â always at top when creating */}
            {generating && (
              <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
                className="mx-4 mt-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center gap-3">
                <div className="flex items-end gap-[1.5px] h-8 w-12 shrink-0">
                  {Array.from({length:8}).map((_,i)=>(
                    <motion.div key={i} className="flex-1 rounded-full bg-orange-400"
                      style={{height:'100%',transformOrigin:'bottom'}}
                      animate={{scaleY:[0.1,0.8,0.1]}}
                      transition={{repeat:Infinity,duration:0.5,delay:i*0.07}}/>
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-orange-300">â¡ Building your Algorithm Hitâ¦ {generateElapsed}s</p>
                  <p className="text-[10px] text-orange-300/60">Injecting chart DNA from Spotify Â· Apple Â· Deezer Â· YouTube</p>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-orange-400/30 border-t-orange-400 animate-spin shrink-0" />
              </motion.div>
            )}
            {tab === 'created' && justGenerated && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="mx-4 mt-2 p-3 rounded-xl bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-500/30 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-orange-300">Your Algorithm Hits are ready! ð</p>
                  <p className="text-[10px] text-orange-300/70">2 versions generated â play them below</p>
                </div>
              </motion.div>
            )}
            {loading ? (
              <div className="p-3 space-y-2">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : feedItems.length === 0 ? (
              tab === 'created' ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-orange-400" />
                  </div>
                  <h3 className="text-base font-black text-foreground mb-2">No Algorithm Hits yet</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Scan a song first, then create your Algorithm Hit powered by real chart data.
                  </p>
                  <button onClick={() => setLeftMode('analyze')}
                    className="px-4 py-2 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/20 transition-all">
                    ð Scan My First Song
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-3">
                  <Music2 className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm font-semibold text-foreground">
                    {tab === 'liked' ? 'No liked songs yet' : 'No songs yet'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tab === 'liked' ? 'Heart songs to save them here' : 'Upload a track to get started'}
                  </p>
                </div>
              )
            ) : (
              <div>
                {feedItems.map((item, i) => {
                  const title = getTitle(item);
                  const styleText = getStyleTags(item);
                  const isActive = activeItem?.data.id === item.data.id;
                  const audioUrl = item.type === 'remix' ? item.data.audio_url : (item.data.audio_url || '');
                  const isCurrentlyPlaying = currentTrack?.audioUrl === audioUrl && audioUrl && isPlaying;
                  const isLiked = likes.has(item.data.id);
                  const imgUrl = item.type === 'remix' ? (item.data.image_url || '') : (item.data.thumbnail_url || '');

                  return (
                    <motion.div key={item.data.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.015 }}
                      onClick={() => {
                        setActiveItem(item);
                        if (!rightOpen) setRightOpen(true);
                        // On mobile: show detail view
                        if (window.innerWidth < 1280) setMobileView('detail');
                      }}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all group ${
                        isActive
                          ? 'bg-white/5 border-l-2 border-l-primary'
                          : 'hover:bg-white/[0.03] border-l-2 border-l-transparent'
                      }`}>

                      {/* Square thumbnail */}
                      <div className="relative w-[60px] h-[60px] rounded-xl overflow-hidden shrink-0">
                        {imgUrl
                          ? <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                          : <div className={`w-full h-full bg-gradient-to-br ${artGradient(item.data.id)} flex items-center justify-center`}>
                              <Music2 className="w-6 h-6 text-white/20" />
                            </div>
                        }

                        {/* Score badge â bottom left */}
                        {item.type === 'analysis' && (
                          <div className="absolute bottom-0.5 left-0.5 px-1 py-0.5 rounded text-[8px] font-black text-white bg-black/70">
                            {item.data.score}
                          </div>
                        )}

                        {/* Duration â bottom right */}
                        <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded text-[8px] text-white/70 bg-black/60 font-mono">
                          3:00
                        </div>

                        {/* Play on hover */}
                        {audioUrl && (
                          <button onClick={e => { e.stopPropagation(); playTrackWithTracking({ id: item.data.id, title, audioUrl }); }}
                            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/60 transition-all rounded-xl">
                            <div className={`w-9 h-9 rounded-full bg-white/90 flex items-center justify-center transition-all ${
                              isCurrentlyPlaying
                                ? 'opacity-100'
                                : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 scale-100 sm:scale-90 sm:group-hover:scale-100'
                            } shadow-lg`}>
                              {isCurrentlyPlaying
                                ? <Pause className="w-4 h-4 text-black" />
                                : <Play className="w-4 h-4 text-black ml-0.5" />}
                            </div>
                          </button>
                        )}

                        {/* Playing bars overlay */}
                        {isCurrentlyPlaying && (
                          <div className="absolute bottom-1 left-1 right-1 flex items-end gap-[1.5px] h-4">
                            {[0,1,2,3].map(j => (
                              <motion.div key={j} className="flex-1 rounded-full bg-white"
                                animate={{ scaleY: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 0.5, delay: j * 0.12 }}
                                style={{ height: '100%', transformOrigin: 'bottom' }} />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-foreground/90'}`}>{title}</p>
                          {/* TYPE badge */}
                          {item.type === 'analysis' && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-primary/15 text-primary uppercase tracking-wider shrink-0">
                              Scanned
                            </span>
                          )}
                          {item.type === 'remix' && (
                            <>
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 uppercase tracking-wider shrink-0">
                                Hit â¡
                              </span>
                              {/* Model label: Faithful=S4 (standard), Viral=S5 (ultra) */}
                              <span className={`text-[7px] font-black px-1 py-0.5 rounded border shrink-0 ${
                                (item.data.remix_title || '').toLowerCase().includes('faithful') || (item.data.remix_title || '').toLowerCase().includes('standard')
                                  ? 'border-slate-500/30 text-slate-400 bg-slate-500/10'
                                  : 'border-violet-500/30 text-violet-400 bg-violet-500/10'
                              }`}>
                                {(item.data.remix_title || '').toLowerCase().includes('faithful') || (item.data.remix_title || '').toLowerCase().includes('standard') ? 'S4' : 'S5'}
                              </span>
                            </>
                          )}
                          {/* NEW badge â shown if play count is 0 */}
                          {(playCounts[item.data.id] || 0) === 0 && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-wider shrink-0 animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                        {/* Style tags */}
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] text-muted-foreground/60 truncate leading-snug">
                            {styleText || fmtDate(item.data.created_at)}
                          </p>
                          {(playCounts[item.data.id] || 0) > 0 && (
                            <span className="text-[9px] text-muted-foreground/50 flex items-center gap-0.5 shrink-0">
                              <Play className="w-2.5 h-2.5" />
                              {playCounts[item.data.id]}Ã played
                            </span>
                          )}
                        </div>
                        {/* Score progression for remix cards */}
                        {item.type === 'remix' && item.data.analysis_id && (
                          (() => {
                            const origAnalysis = analyses.find(a => a.id === item.data.analysis_id);
                            if (!origAnalysis) return null;
                            return (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[9px] text-muted-foreground/50 line-through">{origAnalysis.score}</span>
                                <span className="text-[9px] text-emerald-400 font-bold">â Hit â¡</span>
                              </div>
                            );
                          })()
                        )}
                      </div>

                      {/* Action menu â appears on hover */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {/* Top row: like / share / download â visible on hover (desktop) or always (mobile) */}
                        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={e => handleLike(item.data.id, e)}
                            className={`p-1.5 rounded-full transition-all hover:bg-white/10 ${isLiked ? 'text-red-400' : 'text-white/50 hover:text-white'}`}>
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                          </button>
                          <button onClick={e => handleShare(item, e)}
                            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all">
                            {copiedId === item.data.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                          </button>
                          {audioUrl && (
                            <a href={audioUrl} download={`${title}.mp3`} onClick={e => e.stopPropagation()}
                              className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all">
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {item.type === 'analysis' && (
                            <Link to={`/song/${item.data.id}`} onClick={e => e.stopPropagation()}
                              className="p-1.5 rounded-full text-white/50 hover:text-primary hover:bg-primary/10 transition-all">
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>

                        {/* Bottom row: primary action buttons â visible on hover (desktop) or always (mobile) */}
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {/* Analyze â only for analyses or if we want to re-scan */}
                          {item.type === 'analysis' && (
                            <button
                              onClick={e => { e.stopPropagation(); setActiveItem(item); setLeftMode('analyze'); if (!rightOpen) setRightOpen(true); }}
                              className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/15 hover:bg-primary/25 text-primary text-[9px] font-bold transition-all">
                              <BarChart2 className="w-3 h-3" />
                              Analyze
                            </button>
                          )}

                          {/* Create Viral */}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setActiveItem(item);
                              setLeftMode('create');
                              if (!rightOpen) setRightOpen(true);
                              // If has S3 audio â start create immediately
                              const _url = item.type === 'analysis' ? item.data.audio_url : item.data.audio_url;
                              const _key = _url ? extractS3Key(_url) : null;
                              // FIX: removed auto-trigger — user must click Create button manually
                              // to avoid wasting Suno credits on accidental clicks
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/15 hover:bg-orange-500/30 text-orange-400 text-[9px] font-bold transition-all">
                            <Sparkles className="w-3 h-3" />
                            Viral
                          </button>

                          {/* Cover â create new version from this song */}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setActiveItem(item);
                              setLeftMode('create');
                              // Pre-fill style as 'same' for cover
                              setCreateStyle('same');
                              if (!rightOpen) setRightOpen(true);
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/15 hover:bg-accent/30 text-accent text-[9px] font-bold transition-all">
                            <Music2 className="w-3 h-3" />
                            Cover
                          </button>

                          {/* Remix ð¸ */}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setActiveItem(item);
                              setLeftMode('create');
                              setCreateStyle('same');
                              if (!rightOpen) setRightOpen(true);
                              toast.success(`ð¸ "${title}" loaded for remix`);
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/15 hover:bg-purple-500/30 text-purple-400 text-[9px] font-bold transition-all">
                            <GitBranch className="w-3 h-3" />
                            Remix
                          </button>

                          {/* Publish ð */}
                          {item.type === 'remix' && (
                            <button
                              onClick={e => handlePublish(item, e)}
                              className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 text-[9px] font-bold transition-all">
                              <Globe className="w-3 h-3" />
                              Publish
                            </button>
                          )}

                          {/* Re-scan â for generated tracks */}
                          {item.type === 'remix' && item.data.audio_url && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setActiveItem(item);
                                setLeftMode('analyze');
                                setSongTitle((item.data.remix_title || 'Algorithm Hit') + ' (re-scan)');
                                setSongGenre(item.data.genre || '');
                                setUploadFile(null);
                                if (!rightOpen) setRightOpen(true);
                                toast.info('Upload this track to re-scan it and measure improvement', { duration: 4000 });
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[9px] font-bold transition-all">
                              <BarChart2 className="w-3 h-3" />
                              Re-scan
                            </button>
                          )}

                          {/* More Â·Â·Â· */}
                          <div className="relative">
                            <button
                              onClick={e => { e.stopPropagation(); setSongMoreMenuId(prev => prev === item.data.id ? null : item.data.id); }}
                              className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/30 hover:bg-muted/60 text-muted-foreground text-[9px] font-bold transition-all">
                              <MoreHorizontal className="w-3 h-3" />
                            </button>
                            {songMoreMenuId === item.data.id && (
                              <div className="absolute right-0 bottom-full mb-1 z-30 bg-card border border-border rounded-xl shadow-xl min-w-[130px] py-1 overflow-hidden">
                                {item.type === 'analysis' && (
                                  <Link to={`/song/${item.data.id}`} onClick={e => e.stopPropagation()}
                                    className="flex items-center gap-2 px-3 py-2 text-[11px] text-foreground hover:bg-muted/60 transition-colors">
                                    <Eye className="w-3 h-3" /> View Report
                                  </Link>
                                )}
                                <button onClick={e => { e.stopPropagation(); handleShare(item, e); setSongMoreMenuId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-foreground hover:bg-muted/60 transition-colors">
                                  <Copy className="w-3 h-3" /> Copy link
                                </button>
                                <button onClick={async e => {
                                  e.stopPropagation();
                                  setSongMoreMenuId(null);
                                  const table = item.type === 'remix' ? 'viralize_remixes' : 'viralize_analyses';
                                  await supabase.from(table).delete().eq('id', item.data.id);
                                  await loadData();
                                  if (activeItem?.data.id === item.data.id) setActiveItem(null);
                                  toast.success('Deleted');
                                }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-destructive hover:bg-destructive/10 transition-colors">
                                  <X className="w-3 h-3" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* âââââââââââââââââââââââââââââââ
            RIGHT â Song Detail
        âââââââââââââââââââââââââââââââ */}
        {rightOpen && (
          <div className={`shrink-0 bg-background flex flex-col overflow-hidden border-l border-border/40
            xl:w-[300px]
            ${mobileView === 'detail' ? 'flex w-full absolute inset-0 z-20' : 'hidden xl:flex'}`}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 shrink-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {activeItem ? getTitle(activeItem) : 'Song Detail'}
              </p>
              <button onClick={() => { setRightOpen(false); setMobileView('feed'); }} className="text-muted-foreground hover:text-foreground p-0.5 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div key={activeItem?.data.id || 'empty'}
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }} className="h-full">
                  <RightPanel />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Show right panel toggle if closed */}
        {!rightOpen && (
          <button onClick={() => setRightOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-10 bg-card border border-border rounded-l-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10">
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
        </div>{/* end 3-col row */}

        {/* BOTTOM PLAYER â always last, never overlaps panels */}
        {/* Mobile bottom action bar â replaces the left/right panels on small screens */}
        <div className="lg:hidden flex items-center border-t border-border/40 bg-card/80 shrink-0">
          {/* Tab switcher for feed */}
          <div className="flex items-center gap-0.5 px-2 py-1.5 flex-1 overflow-x-auto no-scrollbar">
            {(['all', 'liked', 'uploads', 'created'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setMobileView('feed'); }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  tab === t && mobileView === 'feed' ? 'bg-muted text-foreground' : 'text-muted-foreground'
                }`}>
                {t === 'all' ? 'All' : t === 'liked' ? 'â¥ Liked' : t === 'uploads' ? 'Uploads' : 'Created'}
              </button>
            ))}
          </div>
          {/* Create + Detail buttons */}
          <div className="flex items-center gap-1 px-2 shrink-0">
            <button onClick={() => setMobileView('create')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all shadow-sm ${
                mobileView === 'create'
                  ? 'bg-amber-500 text-black'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black'
              }`}>
              <Zap className="w-3.5 h-3.5" /> Scan &amp; Create
            </button>
            {activeItem && (
              <button onClick={() => setMobileView('detail')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mobileView === 'detail' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}>
                <Eye className="w-3.5 h-3.5" /> Detail
              </button>
            )}
          </div>
        </div>

      </div>{/* end outer flex-col */}
    </DashboardLayout>
  );
}
