import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, PLAN_LIMITS, Plan } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart2, Music2, RefreshCw, Zap, ArrowRight, Download, TrendingUp, Star,
} from 'lucide-react';

interface Analysis {
  id: string;
  song_title: string;
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
  free: 'bg-white/10 text-white/60',
  payg: 'bg-blue-500/20 text-blue-300',
  pro: 'bg-[#8B5CF6]/20 text-[#8B5CF6]',
  studio: 'bg-[#F59E0B]/20 text-[#F59E0B]',
};

const scoreColor = (s: number) => {
  if (s >= 80) return 'bg-emerald-500/20 text-emerald-400';
  if (s >= 60) return 'bg-[#F59E0B]/20 text-[#F59E0B]';
  return 'bg-red-500/20 text-red-400';
};

const MOCK_ANALYSES: Analysis[] = [
  { id: '1', song_title: 'Electric Dreams', genre: 'Pop', score: 87, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '2', song_title: 'Midnight Waves', genre: 'Electronic', score: 73, created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: '3', song_title: 'Golden Hour', genre: 'R&B', score: 91, created_at: new Date(Date.now() - 259200000).toISOString() },
];

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [remixes, setRemixes] = useState<Remix[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setDataLoading(true);
      try {
        const [{ data: a }, { data: r }] = await Promise.all([
          supabase.from('analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
          supabase.from('remixes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
        ]);
        setAnalyses(a && a.length > 0 ? a : MOCK_ANALYSES);
        setRemixes(r || []);
      } catch {
        setAnalyses(MOCK_ANALYSES);
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
  const avgScore = analyses.length > 0 ? Math.round(analyses.reduce((s, a) => s + a.score, 0) / analyses.length) : 0;

  const formatLimit = (val: number, limit: number) => limit === 999 ? `${val} / ∞` : `${val} / ${limit}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-20 pb-16">
      <div className="container max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold font-heading">
              Welcome back{' '}
              <span className="bg-gradient-to-r from-[#8B5CF6] to-[#F59E0B] bg-clip-text text-transparent">
                {profile?.display_name || user.email?.split('@')[0]} 🎵
              </span>
            </h1>
            <p className="text-white/50 mt-1 text-sm">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${PLAN_COLORS[plan]} border-0 px-3 py-1 text-xs font-semibold uppercase tracking-wide`}>
              {limits.label}
            </Badge>
            {plan !== 'studio' && (
              <Button asChild size="sm" className="rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#F59E0B] text-white border-0 hover:opacity-90 h-8 px-4 text-xs font-semibold">
                <Link to="/settings?tab=billing">Upgrade ✨</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { icon: <BarChart2 className="h-5 w-5 text-[#8B5CF6]" />, label: 'Analyses', value: formatLimit(analysesUsed, limits.analyses) },
            { icon: <RefreshCw className="h-5 w-5 text-[#F59E0B]" />, label: 'Remixes', value: formatLimit(remixesUsed, limits.remixes) },
            { icon: <TrendingUp className="h-5 w-5 text-emerald-400" />, label: 'Avg Score', value: avgScore > 0 ? `${avgScore}/100` : '—' },
            { icon: <Zap className="h-5 w-5 text-blue-400" />, label: 'Credits', value: plan === 'payg' ? credits.toString() : plan === 'free' ? '—' : '∞' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm hover:bg-white/[0.06] transition-colors">
              <div className="flex items-center gap-2 mb-3">
                {stat.icon}
                <span className="text-xs text-white/50 uppercase tracking-widest">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold font-heading">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Usage Progress */}
        {plan !== 'studio' && (
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">Usage This Month</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/70">Analyses</span>
                  <span className="text-white/50">{formatLimit(analysesUsed, limits.analyses)}</span>
                </div>
                <Progress
                  value={limits.analyses === 999 ? 10 : (analysesUsed / limits.analyses) * 100}
                  className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-[#8B5CF6] [&>div]:to-[#7C3AED]"
                />
              </div>
              {limits.remixes > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/70">Remixes</span>
                    <span className="text-white/50">{formatLimit(remixesUsed, limits.remixes)}</span>
                  </div>
                  <Progress
                    value={limits.remixes === 999 ? 10 : (remixesUsed / limits.remixes) * 100}
                    className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-[#F59E0B] [&>div]:to-[#D97706]"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Analyses */}
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Music2 className="h-4 w-4 text-[#8B5CF6]" />
              Recent Analyses
            </h2>
            <Button asChild variant="ghost" size="sm" className="text-xs text-white/40 hover:text-white">
              <Link to="/analyze">+ New Analysis</Link>
            </Button>
          </div>

          {dataLoading ? (
            <div className="p-8 text-center text-white/30 text-sm">Loading...</div>
          ) : analyses.length === 0 ? (
            <div className="p-12 text-center">
              <Star className="h-10 w-10 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 mb-4">No analyses yet</p>
              <Button asChild size="sm" className="rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-0">
                <Link to="/analyze">Analyze your first song <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {['Song', 'Genre', 'Score', 'Date', ''].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs text-white/30 font-medium uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analyses.map((a) => (
                    <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-sm">{a.song_title}</td>
                      <td className="px-6 py-4 text-sm text-white/50">{a.genre}</td>
                      <td className="px-6 py-4">
                        <Badge className={`${scoreColor(a.score)} border-0 text-xs font-semibold`}>{a.score}/100</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/40">
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-[#8B5CF6] hover:text-white hover:bg-[#8B5CF6]/20">
                          <Link to={`/results?id=${a.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Remixes */}
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[#F59E0B]" />
              Recent Remixes
            </h2>
          </div>

          {remixes.length === 0 ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-10 w-10 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 mb-4">No remixes yet</p>
              {plan === 'free' ? (
                <p className="text-xs text-white/30">Upgrade to Pro or Studio to unlock remixes</p>
              ) : (
                <Button asChild size="sm" className="rounded-full bg-[#F59E0B] hover:bg-[#D97706] text-black border-0 font-semibold">
                  <Link to="/analyze">Create your first remix <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {remixes.map((r) => (
                <div key={r.id} className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                  <p className="font-medium text-sm mb-3 truncate">{r.title}</p>
                  <audio controls src={r.audio_url} className="w-full h-8 mb-3" style={{ filter: 'invert(1) hue-rotate(260deg)' }} />
                  <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-white/50 hover:text-white border border-white/10 rounded-lg gap-1">
                    <Download className="h-3 w-3" /> Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
