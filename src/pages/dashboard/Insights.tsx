import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart2, Target, Award, Repeat } from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function Insights() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('viralize_analyses').select('score, genre, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: true })
      .then(({ data }) => { setAnalyses(data || []); setLoading(false); });
  }, [user]);

  const scoreOverTime = useMemo(() =>
    analyses.map((a, i) => ({
      date: format(new Date(a.created_at), 'MMM d'),
      score: a.score,
      avg: Math.round(analyses.slice(0, i + 1).reduce((s, x) => s + x.score, 0) / (i + 1)),
    })),
    [analyses]
  );

  const genreBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalScore: number }> = {};
    analyses.forEach(a => {
      if (!a.genre) return;
      if (!map[a.genre]) map[a.genre] = { count: 0, totalScore: 0 };
      map[a.genre].count++;
      map[a.genre].totalScore += a.score;
    });
    return Object.entries(map).map(([genre, { count, totalScore }]) => ({
      genre, count, avg: Math.round(totalScore / count),
    })).sort((a, b) => b.count - a.count);
  }, [analyses]);

  const avgScore = analyses.length ? Math.round(analyses.reduce((s, a) => s + a.score, 0) / analyses.length) : 0;
  const bestScore = analyses.length ? Math.max(...analyses.map(a => a.score)) : 0;
  const recentAvg = analyses.length > 3
    ? Math.round(analyses.slice(-3).reduce((s, a) => s + a.score, 0) / 3)
    : avgScore;
  const improvement = recentAvg - avgScore;

  const strengths = useMemo(() => {
    if (!analyses.length) return [];
    const high = analyses.filter(a => a.score >= 70);
    const genres = [...new Set(high.map(a => a.genre).filter(Boolean))];
    return genres.slice(0, 3);
  }, [analyses]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Growth & Insights</h1>
          <p className="text-sm text-muted-foreground">Track your improvement over time</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><BarChart2 className="w-4 h-4 text-primary" /><span className="text-[11px] text-muted-foreground uppercase tracking-wider">Avg Score</span></div>
            <p className="text-2xl font-bold text-foreground">{avgScore || '—'}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><Award className="w-4 h-4 text-accent" /><span className="text-[11px] text-muted-foreground uppercase tracking-wider">Best Score</span></div>
            <p className="text-2xl font-bold text-foreground">{bestScore || '—'}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              {improvement >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Trend</span>
            </div>
            <p className={`text-2xl font-bold ${improvement >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
              {improvement > 0 ? '+' : ''}{improvement || '—'}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><Repeat className="w-4 h-4 text-primary" /><span className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Tracks</span></div>
            <p className="text-2xl font-bold text-foreground">{analyses.length}</p>
          </div>
        </div>

        {/* Score Over Time Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Score Progression</h2>
          {loading ? (
            <div className="h-48 bg-muted/50 animate-pulse rounded-lg" />
          ) : scoreOverTime.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={scoreOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} name="Score" />
                <Line type="monotone" dataKey="avg" stroke="hsl(var(--accent))" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Running Avg" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Analyze at least 2 songs to see your progression
            </div>
          )}
        </div>

        {/* Genre Breakdown + Strengths */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Genre Breakdown</h2>
            {genreBreakdown.length > 0 ? (
              <div className="space-y-3">
                {genreBreakdown.map(g => (
                  <div key={g.genre} className="flex items-center gap-3">
                    <span className="text-sm text-foreground w-24 truncate">{g.genre}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${g.avg}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-20 text-right">{g.count} tracks · {g.avg}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No genre data yet</p>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Recurring Strengths</h2>
            {strengths.length > 0 ? (
              <div className="space-y-3">
                {strengths.map(genre => (
                  <div key={genre} className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <Target className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{genre}</p>
                      <p className="text-xs text-muted-foreground">Consistently scoring above 70</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Score above 70 in a genre multiple times to unlock strengths</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
