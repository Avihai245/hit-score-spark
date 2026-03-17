import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Upload, Clock, CheckCircle, AlertCircle, FileAudio, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Uploads() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('viralize_analyses')
      .select('id, title, genre, score, created_at, audio_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setAnalyses(data || []); setLoading(false); });
  }, [user]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Uploads</h1>
            <p className="text-sm text-muted-foreground">Your upload history and processing status</p>
          </div>
          <Button asChild size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg text-xs">
            <Link to="/analyze"><Upload className="w-3.5 h-3.5" /> Upload New</Link>
          </Button>
        </div>

        {/* Guidelines */}
        <div className="bg-muted/30 border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-foreground mb-2">Upload Guidelines</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><FileAudio className="w-3.5 h-3.5 text-primary" /> MP3, WAV, FLAC, AAC</div>
            <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Up to 50MB</div>
            <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-accent" /> Processing: ~60s</div>
            <div className="flex items-center gap-2"><Upload className="w-3.5 h-3.5 text-muted-foreground" /> Best quality = better results</div>
          </div>
        </div>

        {/* Upload history */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Upload History</h2>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {Array(4).fill(0).map((_, i) => <div key={i} className="h-12 bg-muted/50 animate-pulse rounded-lg" />)}
            </div>
          ) : analyses.length > 0 ? (
            <div className="divide-y divide-border">
              {analyses.map(a => (
                <div key={a.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.title || 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground">{a.genre || 'Unknown'} · {new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">Analyzed</Badge>
                  <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-primary hover:bg-primary/10">
                    <Link to={`/song/${a.id}`}>View <ArrowRight className="w-3 h-3 ml-1" /></Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No uploads yet</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
