import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Lightbulb, CheckCircle2, Circle, ArrowRight, Music2, Mic2, Layers, Heart, Radio, ListMusic } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
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

const DEFAULT_RECS: Recommendation[] = [
  { category: 'Hook', title: 'Strengthen your intro hook', description: 'Songs with a memorable hook in the first 8 seconds get 3x more saves on Spotify. Try adding a vocal chop or melodic motif.', impact: 'high', icon: <Mic2 className="w-4 h-4" /> },
  { category: 'Structure', title: 'Optimize song length', description: 'Tracks between 2:30-3:15 perform best algorithmically. Consider tightening your arrangement.', impact: 'high', icon: <Layers className="w-4 h-4" /> },
  { category: 'Chorus', title: 'Increase chorus repetition', description: 'The most viral songs repeat the chorus hook phrase 3-4 times. Your choruses could benefit from more repetition.', impact: 'medium', icon: <Music2 className="w-4 h-4" /> },
  { category: 'Emotion', title: 'Add emotional contrast', description: 'Create stronger dynamics between verses and choruses. The emotional lift drives replay value.', impact: 'medium', icon: <Heart className="w-4 h-4" /> },
  { category: 'Playlist', title: 'Target playlist compatibility', description: 'Your genre positioning could be clearer. Focus on one sonic palette for better editorial playlist placement.', impact: 'low', icon: <ListMusic className="w-4 h-4" /> },
  { category: 'Platform', title: 'Optimize for TikTok format', description: 'Create a 15-30 second hook segment that works standalone. This significantly increases viral potential.', impact: 'high', icon: <Radio className="w-4 h-4" /> },
];

export default function Recommendations() {
  const { user } = useAuth();
  const [hasAnalyses, setHasAnalyses] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('viralize_analyses').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setHasAnalyses((count || 0) > 0));
  }, [user]);

  const recommendations = hasAnalyses ? DEFAULT_RECS : [];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Recommendations</h1>
          <p className="text-sm text-muted-foreground">Prioritized suggestions to improve your music's performance</p>
        </div>

        {/* Priority summary */}
        {recommendations.length > 0 && (
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
        )}

        {/* Recommendations list */}
        {recommendations.length > 0 ? (
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
