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
  thumbnail_url?: string;
}

const scoreColor = (s: number) => {
  if (s >= 80) return 'bg-primary/20 text-primary border-primary/30';
  if (s >= 65) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (s >= 40) return 'bg-accent/20 text-accent border-accent/30';
  return 'bg-destructive/20 text-destructive border-destructive/30';
};

// Generate a consistent gradient from song id
const artGradient = (id: string) => {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hues = [
    'from-purple-600 to-blue-500',
    'from-rose-500 to-orange-400',
    'from-emerald-500 to-teal-400',
    'from-indigo-500 to-violet-500',
    'from-amber-500 to-red-500',
    'from-cyan-500 to-blue-600',
    'from-pink-500 to-purple-600',
    'from-lime-500 to-emerald-500',
  ];
  return hues[hash % hues.length];
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
                      Upload a track and get your viral score with AI insights
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
                      Let AI transform your song into a viral-ready version
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-square rounded-xl bg-muted/50 animate-pulse" />
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {songs.map((song, i) => {
                const isCurrentPlaying = currentTrack?.id === song.id && isPlaying;
                return (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group"
                  >
                    {/* Album art */}
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
                      {song.thumbnail_url ? (
                        <img src={song.thumbnail_url} alt={song.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${artGradient(song.id)} flex items-center justify-center`}>
                          <Music2 className="w-8 h-8 text-white/40" />
                        </div>
                      )}

                      {/* Score badge */}
                      <Badge className={`${scoreColor(song.score)} border text-[11px] font-bold absolute top-2 right-2`}>
                        {song.score}
                      </Badge>

                      {/* Play overlay */}
                      {song.audio_url && (
                        <button
                          onClick={() => playTrack({ id: song.id, title: song.title, audioUrl: song.audio_url! })}
                          className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all"
                        >
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-lg">
                            {isCurrentPlaying
                              ? <Pause className="h-5 w-5 text-black" />
                              : <Play className="h-5 w-5 text-black ml-0.5" />}
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Song info */}
                    <div className="px-0.5">
                      <p className="text-sm font-semibold text-foreground truncate">{song.title || 'Untitled'}</p>
                      <p className="text-xs text-muted-foreground truncate">{song.genre || 'Unknown genre'}</p>

                      {/* Quick actions */}
                      <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button asChild variant="ghost" size="sm" className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-2">
                          <Link to={`/song/${song.id}`}>
                            <Eye className="w-3 h-3" /> Report
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="h-7 text-[11px] text-accent hover:text-accent hover:bg-accent/10 gap-1 px-2">
                          <Link to="/dashboard/viral">
                            <Zap className="w-3 h-3" /> Improve
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
