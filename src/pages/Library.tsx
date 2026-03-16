import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Music, BarChart2, Headphones, Zap, Play, Pause, Download, Search,
  Plus, ArrowRight, Star, Loader2, Trash2, AlertCircle, Share2,
} from 'lucide-react';

/* ─── Types ─── */
interface Analysis {
  id: string;
  title: string;
  genre: string;
  score: number;
  created_at: string;
  verdict?: string;
  full_result?: any;
}

interface Remix {
  id: string;
  title: string;
  audio_url: string;
  style?: string;
  created_at: string;
  analysis_id?: string;
}

/* ─── Helpers ─── */
const scoreColor = (s: number) => {
  if (s >= 80) return 'from-purple-500 to-fuchsia-500';
  if (s >= 65) return 'from-emerald-500 to-green-400';
  if (s >= 40) return 'from-orange-500 to-amber-400';
  return 'from-red-500 to-red-400';
};

const scoreBg = (s: number) => {
  if (s >= 80) return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
  if (s >= 65) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  if (s >= 40) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  return 'bg-red-500/20 text-red-300 border-red-500/30';
};

const scoreLabel = (s: number) => {
  if (s >= 80) return 'HIT POTENTIAL 🔥';
  if (s >= 65) return 'STRONG';
  if (s >= 40) return 'PROMISING';
  return 'NEEDS WORK';
};

const GENRE_GRADIENTS: Record<string, string> = {
  'Pop': 'from-pink-500/60 to-purple-600/60',
  'Hip Hop': 'from-yellow-500/60 to-orange-600/60',
  'R&B': 'from-purple-500/60 to-blue-600/60',
  'Indie Pop': 'from-green-400/60 to-cyan-500/60',
  'Melodic House': 'from-blue-500/60 to-purple-500/60',
  'EDM': 'from-cyan-400/60 to-blue-500/60',
  'Rock': 'from-red-500/60 to-orange-500/60',
  'Latin': 'from-orange-400/60 to-yellow-500/60',
  'Afrobeats': 'from-green-500/60 to-yellow-500/60',
};

const getGenreGradient = (genre?: string) => {
  if (genre && GENRE_GRADIENTS[genre]) return GENRE_GRADIENTS[genre];
  return 'from-violet-500/60 to-pink-500/60';
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/* ─── Loading Skeleton ─── */
const SkeletonCard = () => (
  <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
    <div className="h-32 bg-white/10 animate-pulse" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
      <div className="h-3 bg-white/10 rounded animate-pulse w-1/2" />
      <div className="h-6 bg-white/10 rounded-full animate-pulse w-1/3 mt-3" />
      <div className="h-8 bg-white/10 rounded-xl animate-pulse mt-3" />
    </div>
  </div>
);

/* ─── Analysis Card ─── */
const AnalysisCard = ({ analysis, onDelete }: { analysis: Analysis; onDelete: (id: string) => void }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const gradient = getGenreGradient(analysis.genre);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-200 overflow-hidden"
    >
      {/* Artwork */}
      <div className={`relative h-32 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <Music className="h-12 w-12 text-white/60" />
        {/* Score badge */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-black border ${scoreBg(analysis.score)}`}>
          {analysis.score}
        </div>
        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
          className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-red-500/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-white truncate">{analysis.title || 'Untitled Song'}</h3>
        <p className="text-xs text-white/50 mt-0.5">
          {analysis.genre || 'Unknown Genre'} • {formatDate(analysis.created_at)}
        </p>

        <div className={`mt-3 inline-block px-2.5 py-1 rounded-full text-[10px] font-black border ${scoreBg(analysis.score)}`}>
          {scoreLabel(analysis.score)}
        </div>

        <div className="flex gap-2 mt-3">
          <Button asChild size="sm" variant="outline" className="flex-1 h-8 text-xs border-white/10 hover:bg-white/10 rounded-xl">
            <Link to={`/song/${analysis.id}`}>View Report</Link>
          </Button>
          <Button asChild size="sm" className="flex-1 h-8 text-xs bg-primary/20 hover:bg-primary/30 text-primary border-0 rounded-xl">
            <Link to={`/song/${analysis.id}?remix=1`}>Remix →</Link>
          </Button>
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3 z-10 p-4">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm font-semibold text-white text-center">Delete this analysis?</p>
          <p className="text-xs text-white/50 text-center">This cannot be undone.</p>
          <div className="flex gap-2 w-full">
            <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)} className="flex-1 border-white/20">Cancel</Button>
            <Button size="sm" onClick={() => { onDelete(analysis.id); setConfirmDelete(false); }} className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border-0">Delete</Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

/* ─── Remix Card ─── */
const RemixCard = ({ remix, onDelete }: { remix: Remix; onDelete: (id: string) => void }) => {
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isCurrentlyPlaying = currentTrack?.id === remix.id && isPlaying;

  const handlePlay = () => {
    playTrack({
      id: remix.id,
      title: remix.title,
      audioUrl: remix.audio_url,
    });
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(remix.audio_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${remix.title || 'remix'}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(remix.audio_url, '_blank');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(remix.audio_url);
    toast.success('Link copied to clipboard!');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-200 overflow-hidden"
    >
      {/* Waveform gradient art */}
      <div className="relative h-32 bg-gradient-to-br from-yellow-500/30 to-purple-600/30 flex items-center justify-center overflow-hidden">
        {/* Fake waveform */}
        <div className="flex items-end gap-[3px] h-16 absolute inset-x-4">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-sm bg-white/20"
              style={{ height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 30}%` }}
              animate={isCurrentlyPlaying ? { scaleY: [0.5, 1, 0.5] } : {}}
              transition={isCurrentlyPlaying ? { repeat: Infinity, duration: 0.4 + (i % 5) * 0.1, delay: i * 0.02 } : {}}
            />
          ))}
        </div>
        <button
          onClick={handlePlay}
          className="relative z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-colors flex items-center justify-center"
        >
          {isCurrentlyPlaying ? (
            <Pause className="h-5 w-5 text-white" />
          ) : (
            <Play className="h-5 w-5 text-white ml-0.5" />
          )}
        </button>
        {/* Delete */}
        <button
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
          className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-red-500/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-white truncate">{remix.title || 'AI Remix'}</h3>
        <p className="text-xs text-white/50 mt-0.5">
          AI Remix • {formatDate(remix.created_at)}
        </p>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <Download className="h-3 w-3" /> MP3
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <Share2 className="h-3 w-3" /> Share
          </button>
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3 z-10 p-4">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm font-semibold text-white text-center">Delete this remix?</p>
          <div className="flex gap-2 w-full">
            <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)} className="flex-1 border-white/20">Cancel</Button>
            <Button size="sm" onClick={() => { onDelete(remix.id); setConfirmDelete(false); }} className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border-0">Delete</Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

/* ─── Empty State ─── */
const EmptyState = ({ tab }: { tab: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-24 text-center"
  >
    <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
      <Music className="h-10 w-10 text-white/20" />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">
      {tab === 'remixes' ? 'No remixes yet' : 'Your music journey starts here'}
    </h3>
    <p className="text-white/40 text-sm mb-8 max-w-xs">
      {tab === 'remixes'
        ? 'Create AI remixes from your analyzed songs to make them go viral.'
        : 'Analyze your first song to get your viral score and unlock AI remixes.'}
    </p>
    <Button asChild className="rounded-full bg-gradient-to-r from-primary to-accent text-black font-bold border-0 hover:opacity-90 gap-2">
      <Link to="/analyze">
        <Plus className="h-4 w-4" />
        Analyze Your First Song →
      </Link>
    </Button>
  </motion.div>
);

/* ─── Main Library Component ─── */
type Tab = 'all' | 'analyses' | 'remixes' | 'plan';

export default function Library() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [remixes, setRemixes] = useState<Remix[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setDataLoading(true);
      try {
        const [{ data: a }, { data: r }] = await Promise.all([
          supabase.from('viralize_analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('viralize_remixes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        ]);
        setAnalyses(a || []);
        setRemixes(r || []);
      } catch (err) {
        console.warn('Failed to load library:', err);
      } finally {
        setDataLoading(false);
      }
    };
    load();
  }, [user]);

  const handleDeleteAnalysis = async (id: string) => {
    // Optimistic update
    setAnalyses(prev => prev.filter(a => a.id !== id));
    const { error } = await supabase.from('viralize_analyses').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete analysis');
      // Rollback — re-fetch
      const { data } = await supabase.from('viralize_analyses').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      setAnalyses(data || []);
    } else {
      toast.success('Analysis deleted');
    }
  };

  const handleDeleteRemix = async (id: string) => {
    setRemixes(prev => prev.filter(r => r.id !== id));
    const { error } = await supabase.from('viralize_remixes').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete remix');
      const { data } = await supabase.from('viralize_remixes').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      setRemixes(data || []);
    } else {
      toast.success('Remix deleted');
    }
  };

  const avgScore = useMemo(() => {
    if (!analyses.length) return 0;
    return Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length);
  }, [analyses]);

  const filteredAnalyses = useMemo(() =>
    analyses.filter(a =>
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.genre?.toLowerCase().includes(search.toLowerCase())
    ), [analyses, search]);

  const filteredRemixes = useMemo(() =>
    remixes.filter(r =>
      r.title?.toLowerCase().includes(search.toLowerCase())
    ), [remixes, search]);

  if (loading || !user) return null;

  const plan = profile?.plan || 'free';
  const planLabels: Record<string, string> = { free: 'Free', payg: 'Pay As You Go', pro: 'Pro', studio: 'Studio' };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'all', label: 'All Songs', icon: <Music className="h-4 w-4" />, count: analyses.length + remixes.length },
    { id: 'analyses', label: 'Analyses', icon: <BarChart2 className="h-4 w-4" />, count: analyses.length },
    { id: 'remixes', label: 'Remixes', icon: <Headphones className="h-4 w-4" />, count: remixes.length },
    { id: 'plan', label: 'Credits', icon: <Zap className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-16 pb-24">
      <div className="flex">
        {/* ── Left Sidebar (desktop) ── */}
        <aside className="hidden lg:flex flex-col w-56 fixed left-0 top-16 bottom-0 border-r border-white/5 bg-[#0a0a0a] pt-8 px-4 z-30">
          <div className="mb-8">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold px-3 mb-2">Library</p>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-1 ${
                  tab === t.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={tab === t.id ? 'text-primary' : ''}>{t.icon}</span>
                {t.label}
                {t.count !== undefined && (
                  <span className="ml-auto text-xs text-white/30">{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Upgrade CTA */}
          {plan === 'free' && (
            <div className="mt-auto mb-8 p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20">
              <p className="text-xs font-bold text-white mb-1">Upgrade to Pro</p>
              <p className="text-[11px] text-white/50 mb-3">10 AI remixes/month + unlimited analyses</p>
              <Button asChild size="sm" className="w-full h-7 text-xs bg-gradient-to-r from-primary to-accent text-black font-bold border-0">
                <Link to="/billing">Upgrade ✨</Link>
              </Button>
            </div>
          )}
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 lg:ml-56 px-4 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-black font-heading text-white">My Music Library</h1>

            {/* Stats bar */}
            <div className="flex flex-wrap gap-6 mt-4">
              {[
                { label: 'Songs Analyzed', value: analyses.length },
                { label: 'Remixes Created', value: remixes.length },
                { label: 'Avg Hit Score', value: avgScore ? `${avgScore}/100` : '—' },
                { label: 'Plan', value: planLabels[plan] },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Search + Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                placeholder="Search your library..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <Button asChild className="rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border-0 gap-2 font-semibold">
              <Link to="/analyze">
                <Plus className="h-4 w-4" />
                Analyze New Song
              </Link>
            </Button>
          </div>

          {/* Mobile tabs */}
          <div className="flex lg:hidden gap-1 mb-6 overflow-x-auto pb-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  tab === t.id ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.icon}
                {t.label}
                {t.count !== undefined && <span className="text-white/30">{t.count}</span>}
              </button>
            ))}
          </div>

          {/* Plan Tab */}
          {tab === 'plan' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-6">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Current Plan</p>
                  <p className="text-2xl font-black text-white mt-1">{planLabels[plan]}</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/70">Analyses Used</span>
                      <span className="text-white/50">{profile?.analyses_used || 0}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, ((profile?.analyses_used || 0) / (plan === 'free' ? 1 : 999)) * 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/70">Remixes Used</span>
                      <span className="text-white/50">{profile?.remixes_used || 0}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(100, ((profile?.remixes_used || 0) / (plan === 'free' ? 1 : 10)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
                {plan !== 'studio' && (
                  <Button asChild className="w-full bg-gradient-to-r from-primary to-accent text-black font-bold border-0">
                    <Link to="/billing">Upgrade Plan ✨</Link>
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* Content Grid */}
          {tab !== 'plan' && (
            <>
              {dataLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : (
                <>
                  {/* Analyses section */}
                  {(tab === 'all' || tab === 'analyses') && (
                    <div className="mb-8">
                      {tab === 'all' && filteredAnalyses.length > 0 && (
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                            <BarChart2 className="h-4 w-4" /> Analyses
                          </h2>
                        </div>
                      )}
                      {filteredAnalyses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredAnalyses.map(a => (
                            <AnalysisCard key={a.id} analysis={a} onDelete={handleDeleteAnalysis} />
                          ))}
                        </div>
                      ) : tab === 'analyses' ? (
                        <EmptyState tab="analyses" />
                      ) : null}
                    </div>
                  )}

                  {/* Remixes section */}
                  {(tab === 'all' || tab === 'remixes') && (
                    <div className="mb-8">
                      {tab === 'all' && filteredRemixes.length > 0 && (
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                            <Headphones className="h-4 w-4" /> Remixes
                          </h2>
                        </div>
                      )}
                      {filteredRemixes.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredRemixes.map(r => (
                            <RemixCard key={r.id} remix={r} onDelete={handleDeleteRemix} />
                          ))}
                        </div>
                      ) : tab === 'remixes' ? (
                        <EmptyState tab="remixes" />
                      ) : null}
                    </div>
                  )}

                  {/* True empty */}
                  {tab === 'all' && filteredAnalyses.length === 0 && filteredRemixes.length === 0 && (
                    search ? (
                      <div className="text-center py-16 text-white/40">
                        <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                        <p>No results for "{search}"</p>
                      </div>
                    ) : (
                      <EmptyState tab="all" />
                    )
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
