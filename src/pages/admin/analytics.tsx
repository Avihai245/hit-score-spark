import { useState, useEffect } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { supabase } from '@/lib/supabase';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { subDays } from 'date-fns';

const glassCls = 'bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded-lg ${className}`} />;
}

const GENRE_COLORS = ['#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#3b82f6', '#f97316', '#06b6d4', '#84cc16'];

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState<any[]>([]);
  const [genreData, setGenreData] = useState<any[]>([]);
  const [scoreHistogram, setScoreHistogram] = useState<any[]>([]);
  const [topScores, setTopScores] = useState<any[]>([]);
  const [conversionRate, setConversionRate] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [{ data: users }, { data: analyses }, { data: remixes }] = await Promise.all([
        supabase.from('viralize_users').select('id, plan, created_at'),
        supabase.from('viralize_analyses').select('user_id, created_at, genre, score, title'),
        supabase.from('viralize_remixes').select('user_id, created_at'),
      ]);

      const totalUsers = users?.length ?? 0;
      const usersWithAnalysis = new Set(analyses?.map(a => a.user_id)).size;
      const usersWithRemix = new Set(remixes?.map(r => r.user_id)).size;
      const paidUsers = users?.filter(u => u.plan !== 'free').length ?? 0;

      setConversionRate(totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0);

      setFunnel([
        { stage: 'Signups', count: totalUsers, pct: 100 },
        { stage: 'First Analysis', count: usersWithAnalysis, pct: totalUsers > 0 ? Math.round((usersWithAnalysis / totalUsers) * 100) : 0 },
        { stage: 'Created Remix', count: usersWithRemix, pct: totalUsers > 0 ? Math.round((usersWithRemix / totalUsers) * 100) : 0 },
        { stage: 'Upgraded', count: paidUsers, pct: totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0 },
      ]);

      // Genre distribution
      const genreCounts: Record<string, number> = {};
      analyses?.forEach(a => {
        if (a.genre) genreCounts[a.genre] = (genreCounts[a.genre] ?? 0) + 1;
      });
      setGenreData(
        Object.entries(genreCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([genre, count]) => ({ genre, count }))
      );

      // Score histogram
      const buckets: Record<string, number> = {};
      for (let i = 0; i <= 90; i += 10) buckets[`${i}-${i + 9}`] = 0;
      analyses?.forEach(a => {
        if (a.score != null) {
          const bucket = Math.floor(a.score / 10) * 10;
          const key = `${bucket}-${bucket + 9}`;
          if (buckets[key] !== undefined) buckets[key]++;
        }
      });
      setScoreHistogram(Object.entries(buckets).map(([range, count]) => ({ range, count })));

      // Top scores
      setTopScores(
        (analyses ?? [])
          .filter(a => a.score != null)
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .slice(0, 10)
          .map(a => ({ title: a.title ?? 'Untitled', score: a.score, genre: a.genre }))
      );

      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav />
        <main className="flex-1 overflow-auto p-4 md:p-6 ml-0 md:ml-56">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-xs text-white/40 mt-1">Product performance metrics</p>
          </div>

          {/* Conversion funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className={glassCls}>
              <p className="text-sm font-medium text-white/80 mb-4">Conversion Funnel</p>
              {loading ? <Skeleton className="h-64" /> : (
                <div className="space-y-3">
                  {funnel.map((step, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/70">{step.stage}</span>
                        <span className="text-white/50">{step.count} ({step.pct}%)</span>
                      </div>
                      <div className="h-6 bg-white/5 rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg transition-all duration-500"
                          style={{
                            width: `${step.pct}%`,
                            background: `linear-gradient(90deg, #8b5cf6, #ec4899)`,
                            opacity: 1 - i * 0.15,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/10 mt-4">
                    <p className="text-xs text-white/40">Free → Paid conversion rate:
                      <span className="text-purple-400 ml-2 font-semibold">{conversionRate}%</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Score distribution */}
            <div className={glassCls}>
              <p className="text-sm font-medium text-white/80 mb-4">Score Distribution</p>
              {loading ? <Skeleton className="h-64" /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={scoreHistogram}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="range" tick={{ fill: '#ffffff40', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Bar dataKey="count" name="Songs" radius={[4, 4, 0, 0]}>
                      {scoreHistogram.map((_, i) => (
                        <Cell key={i} fill={`hsl(${270 + i * 8}, 70%, ${50 + i * 2}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Genre distribution */}
            <div className={glassCls}>
              <p className="text-sm font-medium text-white/80 mb-4">Most Analyzed Genres</p>
              {loading ? <Skeleton className="h-64" /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={genreData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" tick={{ fill: '#ffffff40', fontSize: 10 }} />
                    <YAxis dataKey="genre" type="category" tick={{ fill: '#ffffff60', fontSize: 11 }} width={80} />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Bar dataKey="count" name="Analyses" radius={[0, 4, 4, 0]}>
                      {genreData.map((_, i) => (
                        <Cell key={i} fill={GENRE_COLORS[i % GENRE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top scores */}
            <div className={glassCls}>
              <p className="text-sm font-medium text-white/80 mb-4">Top Performing Songs</p>
              {loading ? <Skeleton className="h-64" /> : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {topScores.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-white/30 w-5 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 truncate">{s.title}</p>
                        <p className="text-xs text-white/40">{s.genre ?? 'Unknown'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${s.score}%` }} />
                        </div>
                        <span className="text-xs font-bold text-purple-400 w-8 text-right">{s.score}</span>
                      </div>
                    </div>
                  ))}
                  {topScores.length === 0 && <p className="text-xs text-white/30">No data yet</p>}
                </div>
              )}
            </div>
          </div>

          {/* Pie for genre */}
          {!loading && genreData.length > 0 && (
            <div className={glassCls}>
              <p className="text-sm font-medium text-white/80 mb-4">Genre Share</p>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={genreData} cx="50%" cy="50%" outerRadius={110} dataKey="count" nameKey="genre"
                    label={({ genre, percent }) => `${genre} ${(percent * 100).toFixed(0)}%`}>
                    {genreData.map((_, i) => (
                      <Cell key={i} fill={GENRE_COLORS[i % GENRE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                  <Legend formatter={(val) => <span style={{ color: '#ffffff80', fontSize: 12 }}>{val}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
