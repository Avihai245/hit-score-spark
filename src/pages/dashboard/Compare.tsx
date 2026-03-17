import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { GitCompare, BarChart2, Clock, Music2, Zap, ArrowLeftRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

const BENCHMARK_CATEGORIES = [
  { label: 'Hook Timing', benchmark: '0-8s', description: 'Viral songs hook in the first 8 seconds', icon: <Clock className="w-4 h-4" /> },
  { label: 'Song Length', benchmark: '2:30-3:15', description: 'Optimal duration for streaming algorithms', icon: <Music2 className="w-4 h-4" /> },
  { label: 'Chorus Placement', benchmark: 'Before 45s', description: 'First chorus should hit before 45 seconds', icon: <BarChart2 className="w-4 h-4" /> },
  { label: 'Energy Build', benchmark: '3-5 peaks', description: 'Multiple energy peaks drive retention', icon: <Zap className="w-4 h-4" /> },
];

export default function Compare() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [selectedA, setSelectedA] = useState<string>('');
  const [selectedB, setSelectedB] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    supabase.from('viralize_analyses').select('id, title, score, genre, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        setAnalyses(data || []);
        if (data && data.length >= 2) {
          setSelectedA(data[0].id);
          setSelectedB(data[1].id);
        } else if (data && data.length === 1) {
          setSelectedA(data[0].id);
        }
      });
  }, [user]);

  const trackA = analyses.find(a => a.id === selectedA);
  const trackB = analyses.find(a => a.id === selectedB);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compare to Hits</h1>
          <p className="text-sm text-muted-foreground">Benchmark your tracks against viral patterns and each other</p>
        </div>

        {/* Track selector */}
        {analyses.length >= 2 ? (
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-primary" /> Track Comparison
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <select
                value={selectedA}
                onChange={e => setSelectedA(e.target.value)}
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground"
              >
                {analyses.map(a => (
                  <option key={a.id} value={a.id}>{a.title || 'Untitled'} ({a.score})</option>
                ))}
              </select>
              <div className="text-center text-muted-foreground text-xs font-medium">vs</div>
              <select
                value={selectedB}
                onChange={e => setSelectedB(e.target.value)}
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground"
              >
                {analyses.map(a => (
                  <option key={a.id} value={a.id}>{a.title || 'Untitled'} ({a.score})</option>
                ))}
              </select>
            </div>

            {trackA && trackB && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{trackA.score}</p>
                  <p className="text-xs text-muted-foreground truncate">{trackA.title}</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg flex items-center justify-center">
                  <p className={`text-lg font-bold ${trackA.score > trackB.score ? 'text-emerald-400' : trackA.score < trackB.score ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {trackA.score > trackB.score ? '+' : ''}{trackA.score - trackB.score}
                  </p>
                </div>
                <div className="text-center p-3 bg-accent/10 rounded-lg">
                  <p className="text-2xl font-bold text-accent">{trackB.score}</p>
                  <p className="text-xs text-muted-foreground truncate">{trackB.title}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <GitCompare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Analyze at least 2 songs to compare them</p>
          </div>
        )}

        {/* Benchmark patterns */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" /> Viral Benchmarks
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Industry-standard patterns found in the top 1% of streaming songs
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BENCHMARK_CATEGORIES.map((cat, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {cat.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{cat.label}</p>
                    <Badge className="bg-primary/10 text-primary border-0 text-[9px]">{cat.benchmark}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
