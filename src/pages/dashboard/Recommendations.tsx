import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Lightbulb, Mic2, Layers, Music2, Heart, ListMusic, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Recommendation {
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
}

const IMPACT_COLORS = {
  high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  medium: 'bg-accent/15 text-accent border-accent/20',
  low: 'bg-muted text-muted-foreground border-border',
};

export default function Recommendations() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('viralize_analyses')
      .select('id, title, score, genre, full_result, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { setAnalyses(data || []); setLoading(false); });
  }, [user]);

  const recommendations = useMemo(() => {
    if (!analyses.length) return [];

    const recs: Recommendation[] = [];
    const avgScore = Math.round(analyses.reduce((s, a) => s + (a.score || 0), 0) / analyses.length);
    const latest = analyses[0];
    const latestResult = latest?.full_result as any;

    // Generate recommendations based on real scores
    if (avgScore < 70) {
      recs.push({
        category: 'Hook',
        title: 'Strengthen your intro hook',
        description: `Your average score is ${avgScore}. Songs with a memorable hook in the first 8 seconds get 3x more saves. Try adding a vocal chop or melodic motif in the opening.`,
        impact: 'high',
        icon: <Mic2 className="w-4 h-4" />,
      });
    }

    // Check if latest analysis has specific feedback
    if (latestResult?.breakdown) {
      const breakdown = latestResult.breakdown;
      if (breakdown.structure !== undefined && breakdown.structure < 70) {
        recs.push({
          category: 'Structure',
          title: 'Optimize song structure',
          description: `Your latest track's structure scored ${breakdown.structure}/100. Tracks between 2:30-3:15 with clear verse-chorus-verse patterns perform best algorithmically.`,
          impact: 'high',
          icon: <Layers className="w-4 h-4" />,
        });
      }
      if (breakdown.chorus !== undefined && breakdown.chorus < 75) {
        recs.push({
          category: 'Chorus',
          title: 'Increase chorus impact',
          description: `Chorus strength scored ${breakdown.chorus}/100. The most viral songs repeat the chorus hook phrase 3-4 times with strong dynamic lift.`,
          impact: 'medium',
          icon: <Music2 className="w-4 h-4" />,
        });
      }
      if (breakdown.emotion !== undefined && breakdown.emotion < 70) {
        recs.push({
          category: 'Emotion',
          title: 'Add emotional contrast',
          description: `Emotional impact scored ${breakdown.emotion}/100. Create stronger dynamics between verses and choruses to drive replay value.`,
          impact: 'medium',
          icon: <Heart className="w-4 h-4" />,
        });
      }
    }

    // Always add general platform recs
    recs.push({
      category: 'Platform',
      title: 'Optimize for TikTok format',
      description: 'Create a 15-30 second hook segment that works standalone. This significantly increases viral potential across short-form platforms.',
      impact: 'high',
      icon: <Radio className="w-4 h-4" />,
    });

    if (analyses.length >= 2) {
      const improvement = (analyses[0]?.score || 0) - (analyses[analyses.length - 1]?.score || 0);
      if (improvement > 0) {
        recs.push({
          category: 'Progress',
          title: `You've improved by ${improvement} points!`,
          description: `Your score went from ${analyses[analyses.length - 1]?.score} to ${analyses[0]?.score}. Keep focusing on chorus repetition and hook timing for more gains.`,
          impact: 'low',
          icon: <Lightbulb className="w-4 h-4" />,
        });
      }
    }

    recs.push({
      category: 'Playlist',
      title: 'Target playlist compatibility',
      description: 'Focus on one sonic palette per track for better editorial playlist placement. Mixed genres confuse algorithm categorization.',
      impact: 'low',
      icon: <ListMusic className="w-4 h-4" />,
    });

    return recs;
  }, [analyses]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Recommendations</h1>
          <p className="text-sm text-muted-foreground">Prioritized suggestions based on your actual analysis results</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-muted/30 animate-pulse rounded-xl" />)}
          </div>
        ) : recommendations.length > 0 ? (
          <>
            {/* Priority summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">{recommendations.filter(r => r.impact === 'high').length}</p>
                <p className="text-xs text-muted-foreground">High Impact</p>
              </div>
              <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-accent">{recommendations.filter(r => r.impact === 'medium').length}</p>
                <p className="text-xs text-muted-foreground">Medium Impact</p>
              </div>
              <div className="bg-muted/50 border border-border rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-muted-foreground">{recommendations.filter(r => r.impact === 'low').length}</p>
                <p className="text-xs text-muted-foreground">Quick Wins</p>
              </div>
            </div>

            {/* Recommendations list */}
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                      {rec.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{rec.category}</span>
                        <Badge className={`${IMPACT_COLORS[rec.impact]} border text-[9px]`}>{rec.impact} impact</Badge>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{rec.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Lightbulb className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No recommendations yet</h3>
            <p className="text-sm text-muted-foreground">Analyze your first song to receive personalized AI recommendations</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
