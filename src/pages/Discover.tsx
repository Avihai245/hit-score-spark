import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { Play, Pause, Heart, Share2, Music2, TrendingUp, Zap } from 'lucide-react';

type SortMode = 'new' | 'trending' | 'score';

const fetchPublicSongs = async (sort: SortMode) => {
  let query = supabase
    .from('viralize_remixes')
    .select(`
      id, audio_url, image_url, remix_title, genre, created_at,
      user_id, analysis_id, suno_task_id,
      viralize_users!inner(display_name, email),
      viralize_analyses(score, title, genre)
    `)
    .eq('status', 'public')
    .limit(50);

  if (sort === 'score') {
    query = query.order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data } = await query;
  return data || [];
};

export default function Discover() {
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const [searchParams] = useSearchParams();
  const genreFilter = searchParams.get('genre') || undefined;
  const [songs, setSongs] = useState<any[]>([]);
  const [sort, setSort] = useState<SortMode>('new');
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    fetchPublicSongs(sort).then(data => {
      const filtered = genreFilter
        ? data.filter((s: any) => s.genre?.toLowerCase() === genreFilter.toLowerCase())
        : data;
      setSongs(filtered);
      setLoading(false);
    });
  }, [sort, genreFilter]);

  const handleLike = (id: string) => {
    setLikes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 px-4 py-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-black text-foreground">Discover</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Real songs. Real artists. Real data. See what others turned into hits.
          </p>
        </div>

        {/* Sort tabs */}
        <div className="flex items-center gap-2">
          {(['new', 'trending', 'score'] as SortMode[]).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                sort === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}>
              {s === 'new' ? '🆕 New' : s === 'trending' ? '🔥 Trending' : '🎯 Top Score'}
            </button>
          ))}
        </div>

        {/* Songs list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="rounded-2xl border border-border bg-card/50 p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Music2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">No published songs yet</h3>
            <p className="text-sm text-muted-foreground">Be the first to publish your viral hit!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {songs.map((song, i) => {
              const isPlayingThis = currentTrack?.audioUrl === song.audio_url && isPlaying;
              const originalScore = song.viralize_analyses?.score;
              const artist = song.viralize_users?.display_name || song.viralize_users?.email?.split('@')[0] || 'Artist';

              return (
                <motion.div key={song.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group rounded-2xl border border-border bg-card hover:bg-card/80 p-4 flex items-center gap-4 transition-all">

                  {/* Cover art */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                    {song.image_url
                      ? <img src={song.image_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-primary/30 to-violet-600/30 flex items-center justify-center">
                          <Music2 className="w-6 h-6 text-primary/50" />
                        </div>
                    }
                    {song.audio_url && (
                      <button
                        onClick={() => playTrack({ id: song.id, title: song.remix_title || 'Untitled', audioUrl: song.audio_url })}
                        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition-all">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-lg">
                          {isPlayingThis ? <Pause className="w-3.5 h-3.5 text-black" /> : <Play className="w-3.5 h-3.5 text-black ml-0.5" />}
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {song.remix_title || song.viralize_analyses?.title || 'Untitled Hit'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">@{artist}</span>
                      {song.genre && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{song.genre}</span>
                      )}
                    </div>
                    {/* Score improvement — the key differentiator */}
                    {originalScore && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-muted-foreground/60">Score:</span>
                        <span className="text-[10px] text-muted-foreground/60 line-through">{originalScore}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">→ Hit ✓</span>
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleLike(song.id)}
                      className={`p-1.5 rounded-full transition-all hover:bg-white/10 ${likes.has(song.id) ? 'text-red-400' : 'text-muted-foreground'}`}>
                      <Heart className={`w-4 h-4 ${likes.has(song.id) ? 'fill-current' : ''}`} />
                    </button>
                    <button onClick={() => navigator.clipboard.writeText(window.location.origin + '/discover')}
                      className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
