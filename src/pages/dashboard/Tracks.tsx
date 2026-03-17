import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Music, BarChart2, Headphones, Play, Pause, Download, Search,
  Plus, Trash2, AlertCircle, Filter, Grid3x3, List, Share2,
} from 'lucide-react';

interface Analysis {
  id: string; title: string; genre: string; score: number; created_at: string; verdict?: string;
}

interface Remix {
  id: string; title: string; audio_url: string; created_at: string; analysis_id?: string;
}

const scoreBg = (s: number) => {
  if (s >= 80) return 'bg-primary/20 text-primary border-primary/30';
  if (s >= 65) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (s >= 40) return 'bg-accent/20 text-accent border-accent/30';
  return 'bg-destructive/20 text-destructive border-destructive/30';
};

const scoreLabel = (s: number) => {
  if (s >= 80) return 'HIT POTENTIAL';
  if (s >= 65) return 'STRONG';
  if (s >= 40) return 'PROMISING';
  return 'NEEDS WORK';
};

type Tab = 'all' | 'analyses' | 'remixes';
type ViewMode = 'grid' | 'list';

export default function Tracks() {
  const { user } = useAuth();
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [remixes, setRemixes] = useState<Remix[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [{ data: a }, { data: r }] = await Promise.all([
        supabase.from('viralize_analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('viralize_remixes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      setAnalyses(a || []);
      setRemixes(r || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleDeleteAnalysis = async (id: string) => {
    setAnalyses(prev => prev.filter(a => a.id !== id));
    const { error } = await supabase.from('viralize_analyses').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
      const { data } = await supabase.from('viralize_analyses').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      setAnalyses(data || []);
    } else toast.success('Analysis deleted');
  };

  const handleDeleteRemix = async (id: string) => {
    setRemixes(prev => prev.filter(r => r.id !== id));
    const { error } = await supabase.from('viralize_remixes').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
      const { data } = await supabase.from('viralize_remixes').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      setRemixes(data || []);
    } else toast.success('Remix deleted');
  };

  const filteredAnalyses = useMemo(() => {
    let result = analyses.filter(a =>
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.genre?.toLowerCase().includes(search.toLowerCase())
    );
    if (sortBy === 'score') result.sort((a, b) => b.score - a.score);
    return result;
  }, [analyses, search, sortBy]);

  const filteredRemixes = useMemo(() =>
    remixes.filter(r => r.title?.toLowerCase().includes(search.toLowerCase())),
    [remixes, search]
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: 'All', icon: <Music className="h-3.5 w-3.5" />, count: analyses.length + remixes.length },
    { id: 'analyses', label: 'Analyses', icon: <BarChart2 className="h-3.5 w-3.5" />, count: analyses.length },
    { id: 'remixes', label: 'Remixes', icon: <Headphones className="h-3.5 w-3.5" />, count: remixes.length },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Songs</h1>
            <p className="text-sm text-muted-foreground">
              {analyses.length} analyses · {remixes.length} remixes
            </p>
          </div>
          <Button asChild size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg text-xs">
            <Link to="/analyze"><Plus className="w-3.5 h-3.5" /> Analyze New Song</Link>
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Tabs */}
          <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.icon} {t.label}
                <span className="text-[10px] text-muted-foreground">{t.count}</span>
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search songs..."
              className="w-full pl-8 pr-3 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground"
          >
            <option value="date">Latest first</option>
            <option value="score">Highest score</option>
          </select>

          {/* View mode */}
          <div className="flex gap-0.5 bg-muted/50 rounded-lg p-0.5">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-background shadow-sm' : ''}`}>
              <Grid3x3 className="w-3.5 h-3.5 text-foreground" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-background shadow-sm' : ''}`}>
              <List className="w-3.5 h-3.5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="h-28 bg-muted animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Analyses */}
            {(tab === 'all' || tab === 'analyses') && filteredAnalyses.length > 0 && (
              <div>
                {tab === 'all' && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Analyses</p>}
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3' : 'space-y-2'}>
                  <AnimatePresence>
                    {filteredAnalyses.map(a => (
                      <motion.div key={a.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className={`group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all ${viewMode === 'list' ? 'flex items-center gap-3 p-3' : ''}`}
                      >
                        {viewMode === 'grid' && (
                          <div className="relative h-24 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <Music className="h-8 w-8 text-muted-foreground/40" />
                            <Badge className={`absolute top-2 right-2 ${scoreBg(a.score)} border text-[10px] font-bold`}>{a.score}</Badge>
                          </div>
                        )}
                        {viewMode === 'list' && (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <BarChart2 className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <div className={viewMode === 'grid' ? 'p-3' : 'flex-1 min-w-0'}>
                          <h3 className="text-sm font-semibold text-foreground truncate">{a.title || 'Untitled'}</h3>
                          <p className="text-xs text-muted-foreground">{a.genre || 'Unknown'} · {new Date(a.created_at).toLocaleDateString()}</p>
                          {viewMode === 'grid' && (
                            <div className="flex items-center justify-between mt-2">
                              <Badge className={`${scoreBg(a.score)} border text-[9px]`}>{scoreLabel(a.score)}</Badge>
                              <div className="flex gap-1">
                                <Button asChild size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-primary hover:bg-primary/10">
                                  <Link to={`/song/${a.id}`}>View</Link>
                                </Button>
                                <button onClick={() => handleDeleteAnalysis(a.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        {viewMode === 'list' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={`${scoreBg(a.score)} border text-[10px]`}>{a.score}</Badge>
                            <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-primary hover:bg-primary/10">
                              <Link to={`/song/${a.id}`}>View Report</Link>
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Remixes */}
            {(tab === 'all' || tab === 'remixes') && filteredRemixes.length > 0 && (
              <div>
                {tab === 'all' && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">Remixes</p>}
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3' : 'space-y-2'}>
                  {filteredRemixes.map(r => (
                    <div key={r.id} className={`group bg-card border border-border rounded-xl overflow-hidden hover:border-accent/30 transition-all ${viewMode === 'list' ? 'flex items-center gap-3 p-3' : ''}`}>
                      {viewMode === 'grid' && (
                        <div className="relative h-24 bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                          <Headphones className="h-8 w-8 text-muted-foreground/40" />
                          <button
                            onClick={() => playTrack({ id: r.id, title: r.title, audioUrl: r.audio_url })}
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity"
                          >
                            {currentTrack?.id === r.id && isPlaying
                              ? <Pause className="w-8 h-8 text-white" />
                              : <Play className="w-8 h-8 text-white" />}
                          </button>
                        </div>
                      )}
                      {viewMode === 'list' && (
                        <button onClick={() => playTrack({ id: r.id, title: r.title, audioUrl: r.audio_url })} className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 hover:bg-accent/20 transition-colors">
                          {currentTrack?.id === r.id && isPlaying ? <Pause className="w-4 h-4 text-accent" /> : <Play className="w-4 h-4 text-accent ml-0.5" />}
                        </button>
                      )}
                      <div className={viewMode === 'grid' ? 'p-3' : 'flex-1 min-w-0'}>
                        <h3 className="text-sm font-semibold text-foreground truncate">{r.title || 'AI Remix'}</h3>
                        <p className="text-xs text-muted-foreground">Remix · {new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                      {viewMode === 'list' && (
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => { navigator.clipboard.writeText(r.audio_url); toast.success('Link copied'); }} className="p-1.5 text-muted-foreground hover:text-foreground">
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteRemix(r.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty */}
            {((tab === 'analyses' && filteredAnalyses.length === 0) ||
              (tab === 'remixes' && filteredRemixes.length === 0) ||
              (tab === 'all' && filteredAnalyses.length === 0 && filteredRemixes.length === 0)) && (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Music className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {search ? 'No results found' : 'No songs yet'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {search ? 'Try a different search term' : 'Analyze your first song to get started'}
                </p>
                {!search && (
                  <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg">
                    <Link to="/analyze"><Plus className="w-4 h-4 mr-1" /> Analyze Song</Link>
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
