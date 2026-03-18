import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { ParticleField } from '@/components/ParticleField';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Music, Play, Pause, Download, Share2, Loader2,
  Check, X, Target, Clock, Activity, KeyRound, Zap, Sparkles,
  BarChart2, Headphones, User, MapPin, Smartphone, AlertTriangle,
  Lightbulb, ListMusic, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Score helpers (duplicated from Results.tsx to keep SongDetail self-contained) ─── */
const scoreColor = (s: number) => {
  if (s < 40) return 'hsl(0 84% 60%)';
  if (s < 65) return 'hsl(25 95% 53%)';
  if (s < 80) return 'hsl(142 71% 45%)';
  return 'hsl(270 91% 65%)';
};

const scoreBadge = (s: number) => {
  if (s < 40) return { label: 'NEEDS WORK', cls: 'bg-red-500/15 text-red-400 border-red-500/30' };
  if (s < 65) return { label: 'PROMISING', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' };
  if (s < 80) return { label: 'STRONG', cls: 'bg-green-500/15 text-green-400 border-green-500/30' };
  return { label: 'HIT POTENTIAL 🔥', cls: 'bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-purple-300 border-purple-500/40' };
};

const GENRE_GRADIENTS: Record<string, string> = {
  'Pop': 'from-pink-500 to-purple-600',
  'Hip Hop': 'from-yellow-500 to-orange-600',
  'R&B': 'from-purple-500 to-blue-600',
  'Indie Pop': 'from-green-400 to-cyan-500',
  'Melodic House': 'from-blue-500 to-purple-500',
  'EDM': 'from-cyan-400 to-blue-500',
  'Rock': 'from-red-500 to-orange-500',
  'Latin': 'from-orange-400 to-yellow-500',
  'Afrobeats': 'from-green-500 to-yellow-500',
};
const getGenreGradient = (genre?: string) =>
  genre && GENRE_GRADIENTS[genre] ? GENRE_GRADIENTS[genre] : 'from-violet-500 to-pink-500';

/* ─── Mini Score Gauge (cinematic) ─── */
const MiniGauge = ({ score }: { score: number }) => {
  const r = 60;
  const circ = 2 * Math.PI * r;
  const color = scoreColor(score);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v: number) => Math.round(v));

  useEffect(() => {
    const ctrl = animate(count, score, { duration: 2, ease: [0.16, 1, 0.3, 1] });
    return ctrl.stop;
  }, [count, score]);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
    >
      <motion.div
        className="absolute w-32 h-32 rounded-full blur-[50px] opacity-20"
        style={{ backgroundColor: color }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />
      <svg width="160" height="160" className="-rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="8" strokeOpacity="0.3" />
        <motion.circle
          cx="80" cy="80" r={r} fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          filter="url(#miniGlow)"
        />
        <defs>
          <filter id="miniGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      </svg>
      <div className="absolute text-center">
        <motion.p className="text-4xl font-black" style={{ color }}>{rounded}</motion.p>
        <p className="text-xs text-muted-foreground">/ 100</p>
      </div>
    </motion.div>
  );
};

/* ─── Remix Card (existing remixes for this song) ─── */
const ExistingRemixCard = ({ remix }: { remix: any }) => {
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const isCurrentlyPlaying = currentTrack?.id === remix.id && isPlaying;

  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
      <button
        onClick={() => playTrack({ id: remix.id, title: remix.remix_title || remix.title || 'AI Remix', audioUrl: remix.audio_url, imageUrl: remix.image_url || undefined, sourceTitle: remix.original_title || undefined })}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
      >
        {isCurrentlyPlaying ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{remix.remix_title || remix.title || 'AI Remix'}</p>
        <p className="text-xs text-white/40">{new Date(remix.created_at).toLocaleDateString()}</p>
      </div>
      <button
        onClick={async () => {
          try {
            const res = await fetch(remix.audio_url);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${remix.remix_title || remix.title || 'remix'}.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch { window.open(remix.audio_url, '_blank'); }
        }}
        className="text-white/40 hover:text-white transition-colors p-1"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
};

/* ─── Main SongDetail ─── */
export default function SongDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [analysis, setAnalysis] = useState<any>(null);
  const [existingRemixes, setExistingRemixes] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollToRemix = searchParams.get('remix') === '1';

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      setPageLoading(true);
      const [{ data: a, error: ae }, { data: r }] = await Promise.all([
        supabase.from('viralize_analyses').select('*').eq('id', id).eq('user_id', user.id).single(),
        supabase.from('viralize_remixes').select('*').eq('analysis_id', id).eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      if (ae || !a) { setError('Analysis not found'); setPageLoading(false); return; }
      setAnalysis(a);
      setExistingRemixes(r || []);
      setPageLoading(false);
    };
    load();
  }, [id, user]);

  useEffect(() => {
    if (scrollToRemix && !pageLoading) {
      setTimeout(() => {
        document.getElementById('remix-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [scrollToRemix, pageLoading]);

  if (loading || (!analysis && pageLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || 'Analysis not found'}</p>
        <Button asChild variant="outline" className="border-border">
          <Link to="/library">← Back to Library</Link>
        </Button>
      </div>
    );
  }

  const r = analysis.full_result || {};
  const score = analysis.score || r.score || 0;
  const badge = scoreBadge(score);
  const gradient = getGenreGradient(analysis.genre);
  const plan = profile?.plan || 'free';
  const canRemix = plan !== 'free';

  const SectionBlock = ({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) => (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
        <span>{emoji}</span> {title}
      </h2>
      {children}
    </motion.section>
  );

  return (
    <div className="min-h-screen bg-background text-foreground pt-28 pb-32 relative overflow-hidden">
      <ParticleField count={25} color="hsl(258, 90%, 66%)" speed={0.3} />
      <div className="container max-w-4xl mx-auto px-4 relative z-10">

        {/* Back + breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <button onClick={() => navigate('/library')} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Library
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground/60">{analysis.title || 'Song Detail'}</span>
        </div>

        {/* Hero */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Artwork */}
          <div className={`w-40 h-40 rounded-3xl bg-gradient-to-br ${gradient} flex-shrink-0 flex items-center justify-center border border-border`}>
            <Music className="h-16 w-16 text-primary-foreground/60" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-black text-white mb-1">{analysis.title || 'Untitled Song'}</h1>
            <p className="text-white/50 mb-4">
              {analysis.genre || 'Unknown Genre'} • {new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <span className={`px-3 py-1.5 rounded-full text-sm font-black border ${badge.cls}`}>
                {badge.label}
              </span>
              <MiniGauge score={score} />
            </div>
          </div>
        </div>

        {/* Verdict */}
        {(r.verdict || analysis.verdict) && (
          <SectionBlock emoji="🎯" title="THE VERDICT">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <p className="text-lg text-white/80 leading-relaxed">{r.verdict || analysis.verdict}</p>
            </div>
          </SectionBlock>
        )}

        {/* Viral Potential */}
        {r.viralPotential && (
          <SectionBlock emoji="🔮" title="THE HONEST TRUTH">
            <div className="border-l-4 border-primary bg-primary/5 rounded-r-xl p-6">
              <p className="text-base text-white/80 leading-relaxed">{r.viralPotential}</p>
            </div>
          </SectionBlock>
        )}

        {/* Song Profile */}
        {(r.hookTiming || r.bpmEstimate || r.musicalKey || r.energyLevel) && (
          <SectionBlock emoji="🎵" title="SONG PROFILE">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Clock, label: 'Hook Timing', value: r.hookTiming },
                { icon: Activity, label: 'BPM', value: r.bpmEstimate },
                { icon: KeyRound, label: 'Key', value: r.musicalKey },
                { icon: Zap, label: 'Energy', value: r.energyLevel },
              ].filter(s => s.value).map(stat => (
                <div key={stat.label} className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
                  <stat.icon className="h-4 w-4 text-primary mx-auto mb-2" />
                  <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-base font-bold text-white mt-1">{stat.value}</p>
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Algorithm Scores */}
        {(r.valence != null || r.danceability != null) && (
          <SectionBlock emoji="📊" title="ALGORITHM SCORES">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-5">
              {r.valence != null && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/70">Valence (Sad → Happy)</span>
                    <span className="text-green-400 font-bold">{r.valence}/10</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(r.valence / 10) * 100}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              )}
              {r.danceability != null && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/70">Danceability</span>
                    <span className="text-primary font-bold">{r.danceability}/10</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(r.danceability / 10) * 100}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>
              )}
              {r.saveRatePrediction && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                  <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Save Rate Prediction</p>
                  <p className="text-lg font-bold text-white">{r.saveRatePrediction}</p>
                </div>
              )}
              {r.skipRiskMoment && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Skip Risk</p>
                  </div>
                  <p className="text-sm font-semibold text-red-300">{r.skipRiskMoment}</p>
                </div>
              )}
            </div>
          </SectionBlock>
        )}

        {/* Audience Profile */}
        {(r.targetAudience || r.listeningMoment || r.tikTokFit) && (
          <SectionBlock emoji="👥" title="AUDIENCE PROFILE">
            <div className="grid gap-4 sm:grid-cols-3">
              {r.targetAudience && (
                <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                  <User className="h-5 w-5 text-primary mb-3" />
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Who They Are</p>
                  <p className="text-sm text-white/80">{r.targetAudience}</p>
                </div>
              )}
              {r.listeningMoment && (
                <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                  <MapPin className="h-5 w-5 text-primary mb-3" />
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">When They Listen</p>
                  <p className="text-sm text-white/80">{r.listeningMoment}</p>
                </div>
              )}
              {r.tikTokFit && (
                <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                  <Smartphone className="h-5 w-5 text-primary mb-3" />
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">TikTok Fit</p>
                  <p className="text-sm text-white/80">{r.tikTokFit}</p>
                </div>
              )}
            </div>
          </SectionBlock>
        )}

        {/* Lyric Intelligence */}
        {(r.lyricWeakness || r.lyricFix || r.viralLine) && (
          <SectionBlock emoji="✍️" title="LYRIC INTELLIGENCE">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-6">
              {r.lyricWeakness && r.lyricFix && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider font-medium mb-3">Weakest moment → Suggested fix</p>
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                    <div className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                      <p className="text-sm text-red-400 line-through">"{r.lyricWeakness}"</p>
                    </div>
                    <div className="flex items-center justify-center">→</div>
                    <div className="flex-1 rounded-xl bg-green-500/10 border border-green-500/20 p-4">
                      <p className="text-sm text-green-400 font-medium">"{r.lyricFix}"</p>
                    </div>
                  </div>
                </div>
              )}
              {r.viralLine && r.viralLine !== 'none yet' && (
                <div className="rounded-xl border-2 border-accent/40 bg-accent/10 p-4">
                  <p className="text-xs text-accent font-bold uppercase tracking-wider mb-2">🔥 Viral Line</p>
                  <p className="text-lg font-bold text-accent">"{r.viralLine}"</p>
                </div>
              )}
            </div>
          </SectionBlock>
        )}

        {/* Strengths / Improvements */}
        {(r.strengths?.length > 0 || r.improvements?.length > 0) && (
          <SectionBlock emoji="⚡" title="WHAT'S WORKING vs WHAT TO FIX">
            <div className="grid gap-6 md:grid-cols-2">
              {r.strengths?.length > 0 && (
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-3">
                  <h3 className="text-sm font-bold text-green-400 uppercase tracking-wider">✅ Strengths</h3>
                  {r.strengths.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-green-400" />
                      </div>
                      <span className="text-sm text-white/70">{s}</span>
                    </div>
                  ))}
                </div>
              )}
              {r.improvements?.length > 0 && (
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-3">
                  <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">❌ Fix These</h3>
                  {r.improvements.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="h-3 w-3 text-red-400" />
                      </div>
                      <span className="text-sm text-white/70">{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionBlock>
        )}

        {/* The ONE Change */}
        {r.oneChange && (
          <SectionBlock emoji="🎯" title="THE ONE CHANGE">
            <div className="rounded-2xl border-2 border-accent/40 bg-accent/10 p-8 text-center">
              <Target className="h-8 w-8 text-accent mx-auto mb-4" />
              <p className="text-xl font-black text-white leading-snug max-w-2xl mx-auto">{r.oneChange}</p>
              <p className="text-sm text-white/40 mt-4 italic">This single change could be the difference between 1,000 and 1,000,000 streams.</p>
            </div>
          </SectionBlock>
        )}

        {/* Similar Songs */}
        {r.similarSongs?.length > 0 && (
          <SectionBlock emoji="🏆" title="GENRE COMPARISON">
            <div className="grid gap-4 md:grid-cols-3">
              {r.similarSongs.slice(0, 3).map((song: any, i: number) => (
                <div key={i} className="bg-white/5 rounded-2xl border border-accent/20 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Music className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{song.title}</p>
                      <p className="text-xs text-white/40">{song.artist}</p>
                    </div>
                  </div>
                  {song.whatTheyHaveThatYouDont && (
                    <p className="text-xs text-white/60 leading-relaxed">{song.whatTheyHaveThatYouDont}</p>
                  )}
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Playlist Targets */}
        {r.matchedPlaylists?.length > 0 && (
          <SectionBlock emoji="📋" title="PLAYLIST TARGETS">
            <div className="grid gap-3 sm:grid-cols-2">
              {r.matchedPlaylists.slice(0, 6).map((pl: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <ListMusic className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">{pl.name}</p>
                    {pl.followers && <p className="text-xs text-white/40">{pl.followers} followers</p>}
                    {pl.reason && <p className="text-xs text-primary/70 mt-1">{pl.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Existing Remixes for this song */}
        {existingRemixes.length > 0 && (
          <SectionBlock emoji="🎧" title="YOUR REMIXES FOR THIS SONG">
            <div className="space-y-3">
              {existingRemixes.map(remix => (
                <ExistingRemixCard key={remix.id} remix={remix} />
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Create Remix CTA */}
        <motion.div
          id="remix-section"
          className="rounded-2xl border-2 border-accent/40 bg-gradient-to-b from-accent/[0.08] to-transparent p-8 text-center mt-8 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Animated light sweep */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          />
          <motion.div
            className="text-4xl mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            🎧
          </motion.div>
          <h2 className="text-2xl font-black text-foreground mb-2 relative z-10">Create AI Remix</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto relative z-10">
            {canRemix
              ? 'Upload your audio file to generate an AI-enhanced version with stronger hook and more viral energy.'
              : 'Upgrade to Pro to unlock AI remixes and make your song go viral.'}
          </p>
          {canRemix ? (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button asChild className="bg-gradient-to-r from-accent via-yellow-500 to-accent text-black font-black border-0 hover:opacity-90 gap-2 h-12 px-8 relative overflow-hidden shadow-[0_0_25px_-5px] shadow-accent/40">
                <Link to="/analyze">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  />
                  <Sparkles className="h-5 w-5 relative z-10" />
                  <span className="relative z-10">Upload & Remix This Song</span>
                </Link>
              </Button>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button asChild className="bg-gradient-to-r from-primary to-accent text-black font-black border-0 hover:opacity-90 gap-2 h-12 px-8 relative overflow-hidden shadow-[0_0_25px_-5px] shadow-primary/40">
                <Link to="/billing">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  />
                  <span className="relative z-10">Upgrade to Pro — Unlock Remixes ✨</span>
                </Link>
              </Button>
            </motion.div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
