import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { supabase, PLAN_LIMITS, Plan } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart2, Music2, RefreshCw, Zap, ArrowRight, Download, TrendingUp, Star,
  Play, Pause, Library, Plus,
} from 'lucide-react';

interface Analysis {
  id: string;
  title: string;
  genre: string;
  score: number;
  created_at: string;
}

interface Remix {
  id: string;
  title: string;
  audio_url: string;
  created_at: string;
}

const PLAN_COLORS: Record<Plan, string> = {
  free: 'bg-secondary text-muted-foreground',
  pro: 'bg-primary/20 text-primary',
  studio: 'bg-accent/20 text-accent',
  business: 'bg-emerald-500/20 text-emerald-400',
  unlimited: 'bg-amber-500/20 text-amber-400',
};

const scoreColor = (s: number) => {
  if (s >= 80) return 'bg-purple-500/20 text-purple-400';
  if (s >= 65) return 'bg-emerald-500/20 text-emerald-400';
  if (s >= 40) return 'bg-orange-500/20 text-orange-400';
  return 'bg-red-500/20 text-red-400';
};

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [remixes, setRemixes] = useState<Remix[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [loading, user, navigate]);

  const [totalAnalysesCount, setTotalAnalysesCount] = useState(0);
  const [totalRemixesCount, setTotalRemixesCount] = useState(0);
  const [totalAvgScore, setTotalAvgScore] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setDataLoading(true);
      try {
        const [{ data: a }, { data: r }, { data: allScores }, { count: remixCount }] = await Promise.all([
          supabase.from('viralize_analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
          supabase.from('viralize_remixes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
          supabase.from('viralize_analyses').select('score').eq('user_id', user.id),
          supabase.from('viralize_remixes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);
        setAnalyses(a || []);
        setRemixes(r || []);
        const scores = allScores || [];
        setTotalAnalysesCount(scores.length);
        setTotalRemixesCount(remixCount || 0);
        if (scores.length > 0) {
          setTotalAvgScore(Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length));
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
        toast.error('Could not load your data. Please refresh the page.');
      } finally {
        setDataLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading || !user) return null;

  const plan: Plan = profile?.plan || 'free';
  const limits = PLAN_LIMITS[plan];
  const analysesUsed = profile?.analyses_used || 0;
  const remixesUsed = profile?.remixes_used || 0;
  const credits = profile?.credits || 0;
  // Use real counts from DB queries; fall back to profile counters while loading
  const displayAnalysesCount = totalAnalysesCount || analysesUsed;
  const displayRemixesCount = totalRemixesCount || remixesUsed;
  const avgScore = totalAvgScore;

  const formatLimit = (val: number, limit: number) => limit === 999 ? `${val} / ∞` : `${val} / ${limit}`;

  const recentItems = [
    ...analyses.map(a => ({ ...a, type: 'analysis' as const })),
    ...remixes.map(r => ({ ...r, type: 'remix' as const, score: 0 })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground pt-28 pb-16">
      <div className="container max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold font-heading">
              Welcome back{' '}
              <span className="brand-gradient-text">
                {profile?.display_name || user.email?.split('@')[0]} 🎵
              </span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${PLAN_COLORS[plan]} border-0 px-3 py-1 text-xs font-semibold uppercase tracking-wide`}>
              {limits.label}
            </Badge>
            {plan !== 'studio' && (
              <Button asChild size="sm" className="rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 hover:opacity-90 h-8 px-4 text-xs font-semibold">
                <Link to="/billing">Upgrade ✨</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <BarChart2 className="h-5 w-5 text-primary" />, label: 'Songs Analyzed', value: dataLoading ? '…' : displayAnalysesCount.toString() },
            { icon: <RefreshCw className="h-5 w-5 text-accent" />, label: 'Remixes Made', value: dataLoading ? '…' : displayRemixesCount.toString() },
            { icon: <TrendingUp className="h-5 w-5 text-emerald-400" />, label: 'Avg Hit Score', value: avgScore > 0 ? `${avgScore}/100` : '—' },
            { icon: <Zap className="h-5 w-5 text-blue-400" />, label: 'Credits', value: dataLoading ? '…' : `${credits}` },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-5 hover:bg-card/90 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                {stat.icon}
                <span className="text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold font-heading">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Analyze New Song CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Ready to go viral?</h2>
              <p className="text-sm text-white/50 mt-1">Upload a song and get your viral score in 60 seconds</p>
            </div>
            <div className="flex gap-3">
              <Button asChild className="rounded-full bg-gradient-to-r from-primary to-accent text-black font-bold border-0 hover:opacity-90 gap-2">
                <Link to="/analyze">
                  <Plus className="h-4 w-4" />
                  Analyze New Song
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-white/20 hover:bg-white/5 gap-2">
                <Link to="/library">
                  <Library className="h-4 w-4" />
                  View Library →
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Continue where you left off */}
        {!dataLoading && recentItems.length > 0 && (
          <div className="glass-card overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-primary" />
                Continue where you left off
              </h2>
              <Link to="/library" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-border/30">
              {recentItems.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'analysis' ? 'bg-primary/10' : 'bg-accent/10'}`}>
                    {item.type === 'analysis'
                      ? <BarChart2 className="h-5 w-5 text-primary" />
                      : <Music2 className="h-5 w-5 text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.type === 'analysis' ? `Analysis • Score: ${item.score}` : 'Remix'} • {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.type === 'analysis' && (
                      <>
                        <Badge className={`${scoreColor(item.score)} border-0 text-xs`}>{item.score}</Badge>
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary hover:bg-primary/10">
                          <Link to={`/song/${item.id}`}>View →</Link>
                        </Button>
                      </>
                    )}
                    {item.type === 'remix' && (
                      <button
                        onClick={() => playTrack({ id: item.id, title: item.title, audioUrl: (item as any).audio_url })}
                        className="h-7 w-7 rounded-full bg-accent/20 flex items-center justify-center text-accent hover:bg-accent/30 transition-colors"
                      >
                        {currentTrack?.id === item.id && isPlaying
                          ? <Pause className="h-3 w-3" />
                          : <Play className="h-3 w-3 ml-0.5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Progress */}
        {plan !== 'studio' && (
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Usage This Month</h2>
              <Link to="/billing" className="text-xs text-accent hover:underline">Upgrade</Link>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-foreground/70">Analyses</span>
                  <span className="text-muted-foreground">{formatLimit(analysesUsed, limits.analyses)}</span>
                </div>
                <Progress
                  value={limits.analyses === 999 ? 10 : (analysesUsed / limits.analyses) * 100}
                  className="h-2 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary/80"
                />
              </div>
              {limits.remixes > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground/70">Remixes</span>
                    <span className="text-muted-foreground">{formatLimit(remixesUsed, limits.remixes)}</span>
                  </div>
                  <Progress
                    value={limits.remixes === 999 ? 10 : (remixesUsed / limits.remixes) * 100}
                    className="h-2 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-accent/80"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state if no songs */}
        {!dataLoading && recentItems.length === 0 && (
          <div className="glass-card p-12 text-center">
            <Star className="h-10 w-10 text-muted mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No songs analyzed yet</p>
            <Button asChild size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground border-0">
              <Link to="/analyze">Analyze your first song <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
