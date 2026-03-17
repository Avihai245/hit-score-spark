import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Music2, Search, Filter, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export default function AdminTracks() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterScore, setFilterScore] = useState('all');

  useEffect(() => {
    supabase.from('viralize_analyses')
      .select('*, viralize_users(email)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setTracks(data || []); setLoading(false); });
  }, []);

  const filtered = tracks.filter(t => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.viralize_users?.email?.toLowerCase().includes(search.toLowerCase());
    const matchScore = filterScore === 'all' ||
      (filterScore === 'high' && t.score >= 70) ||
      (filterScore === 'mid' && t.score >= 40 && t.score < 70) ||
      (filterScore === 'low' && t.score < 40);
    return matchSearch && matchScore;
  });

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminNav />
        <main className="flex-1 overflow-auto p-4 md:p-6 ml-0 md:ml-56">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Track Management</h1>
              <p className="text-xs text-muted-foreground">{tracks.length} total tracks</p>
            </div>
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or owner..."
                  className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
            </div>
            <div className="flex gap-1">
              {['all', 'high', 'mid', 'low'].map(f => (
                <button key={f} onClick={() => setFilterScore(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filterScore === f ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  {f === 'all' ? 'All' : f === 'high' ? '70+' : f === 'mid' ? '40-69' : '<40'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">{Array(8).fill(0).map((_, i) => <div key={i} className="h-12 bg-muted/50 animate-pulse rounded-lg" />)}</div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Track</th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Owner</th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Genre</th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Score</th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(t => (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Music2 className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-foreground truncate max-w-[200px]">{t.title || 'Untitled'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[160px]">{t.viralize_users?.email || '—'}</td>
                      <td className="px-4 py-3"><Badge className="bg-muted text-muted-foreground border-0 text-[10px]">{t.genre || '—'}</Badge></td>
                      <td className="px-4 py-3">
                        <Badge className={`border text-[10px] font-bold ${
                          t.score >= 70 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
                          t.score >= 40 ? 'bg-accent/15 text-accent border-accent/20' :
                          'bg-destructive/15 text-destructive border-destructive/20'
                        }`}>{t.score ?? '—'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(t.created_at), 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-40" />No tracks found
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
