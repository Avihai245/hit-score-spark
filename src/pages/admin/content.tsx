import { useState, useEffect } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { supabase } from '@/lib/supabase';
import { Save, Plus, Trash2, ToggleLeft, Megaphone, Tag, Settings, Music } from 'lucide-react';
import { toast } from 'sonner';

const glassCls = 'bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm';

const DEFAULT_GENRES = [
  { genre: 'Pop', benchmark: 85, reference: 'Blinding Lights - The Weeknd' },
  { genre: 'Hip-Hop', benchmark: 90, reference: 'Humble - Kendrick Lamar' },
  { genre: 'EDM', benchmark: 88, reference: 'Levels - Avicii' },
  { genre: 'R&B', benchmark: 82, reference: 'Essence - Wizkid' },
  { genre: 'Latin', benchmark: 87, reference: 'Despacito - Luis Fonsi' },
  { genre: 'Rock', benchmark: 80, reference: 'Bohemian Rhapsody - Queen' },
];

const DEFAULT_FLAGS = [
  { id: 'remix_ai', name: 'AI Remix Feature', plans: ['pro', 'studio'], enabled: true },
  { id: 'batch_analyze', name: 'Batch Analysis', plans: ['studio'], enabled: true },
  { id: 'api_access', name: 'API Access', plans: ['studio'], enabled: true },
  { id: 'export_pdf', name: 'PDF Export', plans: ['pro', 'studio'], enabled: true },
  { id: 'genre_detection', name: 'Auto Genre Detection', plans: ['free', 'payg', 'pro', 'studio'], enabled: true },
];

export default function AdminContent() {
  const [genres, setGenres] = useState(DEFAULT_GENRES);
  const [banner, setBanner] = useState({ enabled: false, text: '', type: 'info' as 'info' | 'warning' | 'success' });
  const [flags, setFlags] = useState(DEFAULT_FLAGS);
  const [promo, setPromo] = useState({ code: '', discount: '', type: 'percent' as 'percent' | 'amount', maxUses: '' });
  const [promos, setPromos] = useState<any[]>([]);
  const [savingGenres, setSavingGenres] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);

  // Load settings from Supabase admin_settings table if it exists
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from('admin_settings')
          .select('*')
          .in('key', ['banner', 'genre_benchmarks', 'feature_flags', 'promo_codes']);
        if (!data) return;
        data.forEach((row: any) => {
          if (row.key === 'banner' && row.value) setBanner(row.value);
          if (row.key === 'genre_benchmarks' && row.value?.length) setGenres(row.value);
          if (row.key === 'feature_flags' && row.value?.length) setFlags(row.value);
          if (row.key === 'promo_codes' && row.value?.length) setPromos(row.value);
        });
      } catch {
        // Table may not exist yet — that's fine
      }
    };
    load();
  }, []);

  const saveToSupabase = async (key: string, value: any) => {
    await supabase
      .from('admin_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  };

  const handleSaveGenres = async () => {
    setSavingGenres(true);
    try {
      await saveToSupabase('genre_benchmarks', genres);
      toast.success('Genre benchmarks saved');
    } catch {
      toast.error('Failed to save (admin_settings table may not exist)');
    }
    setSavingGenres(false);
  };

  const handleSaveBanner = async () => {
    setSavingBanner(true);
    try {
      await saveToSupabase('banner', banner);
      toast.success('Banner settings saved');
    } catch {
      toast.error('Failed to save');
    }
    setSavingBanner(false);
  };

  const handleToggleFlag = async (id: string) => {
    const updated = flags.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f);
    setFlags(updated);
    await saveToSupabase('feature_flags', updated);
    toast.success('Feature flag updated');
  };

  const handleAddPromo = async () => {
    if (!promo.code || !promo.discount) return;
    const updated = [...promos, { ...promo, id: Date.now(), uses: 0, created_at: new Date().toISOString() }];
    setPromos(updated);
    await saveToSupabase('promo_codes', updated);
    toast.success(`Promo code ${promo.code} created`);
    setPromo({ code: '', discount: '', type: 'percent', maxUses: '' });
  };

  const handleDeletePromo = async (id: number) => {
    const updated = promos.filter(p => p.id !== id);
    setPromos(updated);
    await saveToSupabase('promo_codes', updated);
    toast.success('Promo code deleted');
  };

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav />
        <main className="flex-1 overflow-auto p-4 md:p-6 ml-0 md:ml-56">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Content Management</h1>
            <p className="text-xs text-white/40 mt-1">Platform settings and configuration</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Genre Benchmarks */}
            <div className={`${glassCls} lg:col-span-2`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-purple-400" />
                  <p className="text-sm font-medium text-white/80">Genre Benchmarks</p>
                </div>
                <button
                  onClick={handleSaveGenres}
                  disabled={savingGenres}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 text-purple-300 border border-purple-500/20 rounded-lg text-xs hover:bg-purple-600/30 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingGenres ? 'Saving...' : 'Save'}
                </button>
              </div>
              <p className="text-xs text-white/40 mb-4">Edit viral song references and benchmark scores used for analysis comparison.</p>
              <div className="space-y-3">
                {genres.map((g, i) => (
                  <div key={i} className="grid grid-cols-3 gap-3 items-center">
                    <input
                      value={g.genre}
                      onChange={e => {
                        const updated = [...genres];
                        updated[i] = { ...g, genre: e.target.value };
                        setGenres(updated);
                      }}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                      placeholder="Genre"
                    />
                    <input
                      value={g.reference}
                      onChange={e => {
                        const updated = [...genres];
                        updated[i] = { ...g, reference: e.target.value };
                        setGenres(updated);
                      }}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                      placeholder="Reference song"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0} max={100}
                        value={g.benchmark}
                        onChange={e => {
                          const updated = [...genres];
                          updated[i] = { ...g, benchmark: parseInt(e.target.value) };
                          setGenres(updated);
                        }}
                        className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                      />
                      <button
                        onClick={() => setGenres(genres.filter((_, j) => j !== i))}
                        className="p-2 text-white/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setGenres([...genres, { genre: '', benchmark: 80, reference: '' }])}
                className="mt-3 flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add genre
              </button>
            </div>

            {/* Announcement Banner */}
            <div className={glassCls}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-yellow-400" />
                  <p className="text-sm font-medium text-white/80">Announcement Banner</p>
                </div>
                <button
                  onClick={handleSaveBanner}
                  disabled={savingBanner}
                  className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600/20 text-yellow-300 border border-yellow-500/20 rounded-lg text-xs hover:bg-yellow-600/30 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingBanner ? 'Saving...' : 'Save'}
                </button>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setBanner(b => ({ ...b, enabled: !b.enabled }))}
                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${banner.enabled ? 'bg-purple-600' : 'bg-white/20'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${banner.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                  <span className="text-sm text-white/70">{banner.enabled ? 'Banner visible' : 'Banner hidden'}</span>
                </label>
                <textarea
                  value={banner.text}
                  onChange={e => setBanner(b => ({ ...b, text: e.target.value }))}
                  placeholder="Enter banner message..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 resize-none"
                />
                <select
                  value={banner.type}
                  onChange={e => setBanner(b => ({ ...b, type: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="info">ℹ️ Info</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="success">✅ Success</option>
                </select>
                {banner.enabled && banner.text && (
                  <div className={`p-3 rounded-lg text-sm ${
                    banner.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-300' :
                    banner.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-300' :
                    'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                  }`}>
                    Preview: {banner.text}
                  </div>
                )}
              </div>
            </div>

            {/* Feature Flags */}
            <div className={glassCls}>
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-purple-400" />
                <p className="text-sm font-medium text-white/80">Feature Flags</p>
              </div>
              <div className="space-y-3">
                {flags.map((flag) => (
                  <div key={flag.id} className="flex items-center justify-between py-2 border-b border-white/5">
                    <div>
                      <p className="text-sm text-white/80">{flag.name}</p>
                      <div className="flex gap-1 mt-1">
                        {flag.plans.map(plan => (
                          <span key={plan} className="px-1.5 py-0.5 bg-white/10 text-white/40 rounded text-[10px]">{plan}</span>
                        ))}
                      </div>
                    </div>
                    <div
                      onClick={() => handleToggleFlag(flag.id)}
                      className={`w-10 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${flag.enabled ? 'bg-purple-600' : 'bg-white/20'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${flag.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Promo Codes */}
            <div className={`${glassCls} lg:col-span-2`}>
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-green-400" />
                <p className="text-sm font-medium text-white/80">Promo Codes</p>
              </div>
              {/* Create */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <input
                  value={promo.code}
                  onChange={e => setPromo(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="Code (e.g. LAUNCH50)"
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 uppercase"
                />
                <input
                  value={promo.discount}
                  onChange={e => setPromo(p => ({ ...p, discount: e.target.value }))}
                  placeholder="Discount (e.g. 50)"
                  type="number"
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                />
                <select
                  value={promo.type}
                  onChange={e => setPromo(p => ({ ...p, type: e.target.value as any }))}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="percent">% Discount</option>
                  <option value="amount">$ Off</option>
                </select>
                <button
                  onClick={handleAddPromo}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600/20 text-green-300 border border-green-500/20 rounded-lg text-sm hover:bg-green-600/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Code
                </button>
              </div>
              {/* List */}
              {promos.length > 0 ? (
                <div className="space-y-2">
                  {promos.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg">
                      <code className="text-green-400 font-mono text-sm">{p.code}</code>
                      <span className="text-white/60 text-sm">
                        {p.type === 'percent' ? `${p.discount}% off` : `$${p.discount} off`}
                      </span>
                      <span className="text-white/40 text-xs">{p.uses ?? 0} uses</span>
                      <button
                        onClick={() => handleDeletePromo(p.id)}
                        className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/30">No promo codes yet</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
