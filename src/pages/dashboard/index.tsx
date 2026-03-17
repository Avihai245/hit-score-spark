import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search, Music2, Rocket, ArrowRight, Play, Pause, Zap, Eye,
} from 'lucide-react';

interface Analysis {
  id: string;
  title: string;
  genre: string;
  score: number;
  created_at: string;
  audio_url?: string;
}

const scoreColor = (s: number) => {
  if (s >= 80) return 'bg-primary/20 text-primary border-primary/30';
  if (s >= 65) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (s >= 40) return 'bg-accent/20 text-accent border-accent/30';
  return 'bg-destructive/20 text-destructive border-destructive/30';
};

export default function DashboardHome() {
  const { user, profile } = useAuth();
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const [songs, setSongs] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('viralize_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setSongs(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hey, {profile?.display_name || user.email?.split('@')[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            What do you want to do today?
          </p>
        </div>

        {/* Two big action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Link to="/analyze" className="block group">
              <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-6 hover:border-primary/40 hover:bg-primary/10 transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Analyze a Song</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload a track and get your viral score with AI insights in seconds
                    </p>
                  </div>
                </div>
                <ArrowRight className="absolute top-6 right-5 w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Link to="/dashboard/viral" className="block group">
              <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-accent/5 p-6 hover:border-accent/40 hover:bg-accent/10 transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Rocket className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Make it a Hit</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Let our AI transform your song into a viral-ready version
                    </p>
                  </div>
                </div>
                <ArrowRight className="absolute top-6 right-5 w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          </motion.div>
        </div>

        {/* My Songs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Music2 className="w-5 h-5 text-primary" /> My Songs
            </h2>
            {songs.length > 0 && (
              <span className="text-xs text-muted-foreground">{songs.length} track{songs.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 rounded-xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : songs.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <Music2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground mb-1">No songs yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Analyze your first track to get started</p>
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg">
                <Link to="/analyze">
                  <Search className="w-4 h-4 mr-1.5" /> Analyze Your First Song
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {songs.map((song, i) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group rounded-xl border border-border bg-card hover:border-border/80 hover:bg-muted/30 transition-all duration-150 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{song.title || 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{song.genre || 'Unknown genre'}</p>
                      </div>
                      <Badge className={`${scoreColor(song.score)} border text-xs font-bold shrink-0`}>
                        {song.score}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {song.audio_url && (
                        <button
                          onClick={() => playTrack({ id: song.id, title: song.title, audioUrl: song.audio_url! })}
                          className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                        >
                          {currentTrack?.id === song.id && isPlaying
                            ? <Pause className="h-3.5 w-3.5" />
                            : <Play className="h-3.5 w-3.5 ml-0.5" />}
                        </button>
                      )}
                      <Button asChild variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1">
                        <Link to={`/song/${song.id}`}>
                          <Eye className="w-3.5 h-3.5" /> Report
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="h-8 text-xs text-accent hover:text-accent hover:bg-accent/10 gap-1 ml-auto">
                        <Link to="/dashboard/viral">
                          <Zap className="w-3.5 h-3.5" /> Improve
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
