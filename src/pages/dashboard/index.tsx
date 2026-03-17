import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { supabase, PLAN_LIMITS, Plan } from '@/lib/supabase';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart2, Music2, TrendingUp, Zap, ArrowRight, Plus, Play, Pause,
  Star, Lightbulb, Clock, RefreshCw,
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

const scoreColor = (s: number) => {
  if (s >= 80) return 'bg-primary/20 text-primary';
  if (s >= 65) return 'bg-emerald-500/20 text-emerald-400';
  if (s >= 40) return 'bg-accent/20 text-accent';
  return 'bg-destructive/20 text-destructive';
};

export default function DashboardHome() {
  const { user, profile } = useAuth();
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [remixes, setRemixes] = useState<Remix[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [totalAnalyses, setTotalAnalyses] = useState(0);
  const [totalRemixes, setTotalRemixes] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setDataLoading(true);
      try {
        const [{ data: a }, { data: r }, { data: allScores }, { count: remixCount }] = await Promise.all([
          supabase.from('viralize_analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('viralize_remixes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('viralize_analyses').select('score').eq('user_id', user.id),
          supabase.from('viralize_remixes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);
        setAnalyses(a || []);
        setRemixes(r || []);
        const scores = allScores || [];
        setTotalAnalyses(scores.length);
        setTotalRemixes(remixCount || 0);
        if (scores.length > 0) {
          setAvgScore(Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length));
          setBestScore(Math.max(...scores.map(s => s.score)));
        }
      } catch { /* ignore */ } finally {
        setDataLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user) return null;

  const plan: Plan = (profile?.plan as Plan) || 'free';
  const limits = PLAN_LIMITS[plan];
  const analysesUsed = profile?.analyses_used || 0;
  const remixesUsed = profile?.remixes_this_month || 0;
  const credits = profile?.credits || 0;

  const recentItems = [
    ...analyses.map(a => ({ ...a, type: 'analysis' as const })),
    ...remixes.map(r => ({ ...r, type: 'remix' as const, score: 0 })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  const statCards = [
    { icon: <BarChart2 className="h-4 w-4 text-primary" />, label: 'Songs Analyzed', value: dataLoading ? '—' : totalAnalyses.toString(), change: null },
    { icon: <RefreshCw className="h-4 w-4 text-accent" />, label: 'Remixes Created', value: dataLoading ? '—' : totalRemixes.toString(), change: null },
    { icon: <TrendingUp className="h-4 w-4 text-emerald-400" />, label: 'Avg Score', value: avgScore > 0 ? `${avgScore}` : '—', change: null },
    { icon: <Star className="h-4 w-4 text-accent" />, label: 'Best Score', value: bestScore > 0 ? `${bestScore}` : '—', change: null },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {profile?.display_name || user.email?.split('@')[0]}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Here's your music intelligence overview
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg text-xs">
              <Link to="/analyze"><Plus className="w-3.5 h-3.5" /> Analyze Song</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-lg text-xs border-border hover:bg-muted/50">
              <Link to="/dashboard/tracks"><Music2 className="w-3.5 h-3.5" /> View Library</Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 hover:border-border/80 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                {stat.icon}
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Analyze CTA + Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 rounded-xl border border-primary/20 bg-primary/5 p-5"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Ready to analyze your next track?</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Get your viral score and AI-powered insights in under 60 seconds
                </p>
              </div>
              <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg shrink-0">
                <Link to="/analyze">
                  <Zap className="w-4 h-4" /> Analyze Now
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Usage widget */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Usage</span>
              <Badge className="bg-primary/10 text-primary border-0 text-[10px]">{PLAN_LIMITS[plan].label}</Badge>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Analyses</span>
                  <span className="text-foreground">{analysesUsed} / {limits.analyses === 999 ? '∞' : limits.analyses}</span>
                </div>
                <Progress value={limits.analyses === 999 ? 5 : (analysesUsed / limits.analyses) * 100} className="h-1.5 bg-muted [&>div]:bg-primary" />
              </div>
              {limits.remixes > 0 && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Remixes</span>
                    <span className="text-foreground">{remixesUsed} / {limits.remixes === 999 ? '∞' : limits.remixes}</span>
                  </div>
                  <Progress value={limits.remixes === 999 ? 5 : (remixesUsed / limits.remixes) * 100} className="h-1.5 bg-muted [&>div]:bg-accent" />
                </div>
              )}
              {plan === 'payg' && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Credits</span>
                  <span className="text-accent font-medium">{credits}</span>
                </div>
              )}
            </div>
            {plan !== 'studio' && (
              <Link to="/dashboard/billing" className="block mt-3 text-[11px] text-primary hover:underline text-center">
                Upgrade plan <ArrowRight className="w-3 h-3 inline" />
              </Link>
            )}
          </div>
        </div>

        {/* AI Quick Insight */}
        {avgScore > 0 && (
          <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">AI Insight</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {avgScore >= 70
                  ? `Your average score of ${avgScore} is strong. Focus on hook strength and chorus impact to push into hit territory.`
                  : avgScore >= 40
                  ? `Your average score is ${avgScore}. Our AI recommends improving intro hooks and repetition patterns for better algorithmic performance.`
                  : `Your average score is ${avgScore}. Consider studying structure patterns of trending songs in your genre for the biggest improvement.`}
              </p>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {!dataLoading && recentItems.length > 0 && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Recent Activity</span>
              </div>
              <Link to="/dashboard/tracks" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentItems.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'analysis' ? 'bg-primary/10' : 'bg-accent/10'}`}>
                    {item.type === 'analysis'
                      ? <BarChart2 className="h-4 w-4 text-primary" />
                      : <Music2 className="h-4 w-4 text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.type === 'analysis' ? 'Analysis' : 'Remix'} · {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.type === 'analysis' && (
                      <>
                        <Badge className={`${scoreColor(item.score)} border-0 text-xs`}>{item.score}</Badge>
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary hover:bg-primary/10">
                          <Link to={`/song/${item.id}`}>View</Link>
                        </Button>
                      </>
                    )}
                    {item.type === 'remix' && (
                      <button
                        onClick={() => playTrack({ id: item.id, title: item.title, audioUrl: (item as any).audio_url })}
                        className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent hover:bg-accent/20 transition-colors"
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

        {/* Empty state */}
        {!dataLoading && recentItems.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Music2 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No songs analyzed yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Upload your first track to get started</p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg">
              <Link to="/analyze">Analyze Your First Song <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
