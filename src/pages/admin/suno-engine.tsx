/**
 * Admin: Suno Style Engine
 * Genre DNA editor for per-genre Suno production settings.
 * Table: suno_genre_dna (upsert on save)
 */
import { useState, useEffect } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Search, Plus, Save, ExternalLink, RefreshCw, Zap, ChevronRight, Music2, X,
} from 'lucide-react';

const glassCls = 'bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm';

// Default genre presets (used if DB is empty)
const GENRE_PRESETS: GenreDNA[] = [
  {
    id: '', genre: 'afro house', display_name: 'Afro House',
    bpm_range: '124-130', typical_key: 'A minor', hook_timing: '0:20',
    production_era: '2024 Afrobeats', viral_elements: ['808 bass', 'snare on 2+4', 'melodic hook', 'tribal percussion'],
    suno_style_prefix: 'afro house, african percussion, deep bass, hypnotic groove',
    suno_style_suffix: 'club ready, dancefloor energy',
    reference_artists: ['Black Coffee', 'Themba', 'Da Capo', 'Culoe De Song'],
    reference_tracks: ['We Dance Again', 'Never Gonna Forget', 'Beautiful'],
    deezer_genre_id: 152, streams_benchmark: 2000000,
  },
  {
    id: '', genre: 'pop', display_name: 'Pop',
    bpm_range: '100-130', typical_key: 'C major', hook_timing: '0:30',
    production_era: '2024 Pop', viral_elements: ['catchy hook', 'bright synths', 'four-on-floor kick', 'big chorus'],
    suno_style_prefix: 'pop, catchy melody, upbeat production, modern radio sound',
    suno_style_suffix: 'mainstream appeal, radio ready',
    reference_artists: ['Taylor Swift', 'Olivia Rodrigo', 'Dua Lipa', 'Sabrina Carpenter'],
    reference_tracks: ['Cruel Summer', 'good 4 u', 'Levitating'],
    deezer_genre_id: 132, streams_benchmark: 5000000,
  },
  {
    id: '', genre: 'hip hop', display_name: 'Hip Hop',
    bpm_range: '80-100', typical_key: 'G minor', hook_timing: '0:16',
    production_era: '2024 Trap/Hip-Hop', viral_elements: ['808 trap hi-hats', 'sub bass', 'melodic rap', 'drill beat'],
    suno_style_prefix: 'hip hop, trap beat, 808 bass, rap, urban',
    suno_style_suffix: 'street energy, authentic',
    reference_artists: ['Drake', 'Travis Scott', 'Post Malone', 'Kendrick Lamar'],
    reference_tracks: ['God\'s Plan', 'SICKO MODE', 'Rockstar'],
    deezer_genre_id: 116, streams_benchmark: 4000000,
  },
  {
    id: '', genre: 'r&b', display_name: 'R&B',
    bpm_range: '65-95', typical_key: 'Db major', hook_timing: '0:25',
    production_era: '2024 Neo-Soul/R&B', viral_elements: ['smooth chords', 'falsetto', 'sensual groove', 'lo-fi texture'],
    suno_style_prefix: 'r&b, soul, smooth production, emotional vocals, neo-soul',
    suno_style_suffix: 'intimate feel, late night vibes',
    reference_artists: ['SZA', 'The Weeknd', 'Frank Ocean', 'Daniel Caesar'],
    reference_tracks: ['Kill Bill', 'Blinding Lights', 'Thinking Bout You'],
    deezer_genre_id: 15, streams_benchmark: 3000000,
  },
  {
    id: '', genre: 'latin', display_name: 'Latin',
    bpm_range: '90-100', typical_key: 'A minor', hook_timing: '0:20',
    production_era: '2024 Reggaeton/Latin Pop', viral_elements: ['dembow rhythm', 'brass stabs', 'danceable beat', 'reggaeton flow'],
    suno_style_prefix: 'latin, reggaeton, tropical, dancehall, festive energy',
    suno_style_suffix: 'party vibes, latin heat',
    reference_artists: ['Bad Bunny', 'J Balvin', 'Rosalía', 'Karol G'],
    reference_tracks: ['Tití Me Preguntó', 'Con Calma', 'BZRP Session #53'],
    deezer_genre_id: 197, streams_benchmark: 6000000,
  },
  {
    id: '', genre: 'melodic house', display_name: 'Melodic House',
    bpm_range: '120-128', typical_key: 'A minor', hook_timing: '1:30',
    production_era: '2024 Melodic Techno/House', viral_elements: ['hypnotic bassline', 'organic percussion', 'emotional buildup', 'filtered chords'],
    suno_style_prefix: 'melodic house, organic techno, hypnotic groove, atmospheric',
    suno_style_suffix: 'club energy, festival ready',
    reference_artists: ['Fisher', 'Chris Lake', 'Lane 8', 'Anyma'],
    reference_tracks: ['Losing It', 'Angel of Us', 'Atlas'],
    deezer_genre_id: 64, streams_benchmark: 1500000,
  },
  {
    id: '', genre: 'rock', display_name: 'Rock',
    bpm_range: '120-140', typical_key: 'E minor', hook_timing: '0:45',
    production_era: '2024 Alternative Rock', viral_elements: ['electric guitar riff', 'power drums', 'raw energy', 'memorable chorus'],
    suno_style_prefix: 'rock, electric guitar, powerful drums, alternative, energetic',
    suno_style_suffix: 'raw emotion, stadium energy',
    reference_artists: ['Imagine Dragons', 'Twenty One Pilots', 'Coldplay', 'Linkin Park'],
    reference_tracks: ['Enemy', 'Stressed Out', 'My Universe'],
    deezer_genre_id: 152, streams_benchmark: 2500000,
  },
  {
    id: '', genre: 'indie pop', display_name: 'Indie Pop',
    bpm_range: '100-120', typical_key: 'C major', hook_timing: '0:35',
    production_era: '2024 Indie/Alt Pop', viral_elements: ['lo-fi texture', 'jangly guitar', 'emotional lyrics', 'bedroom pop sound'],
    suno_style_prefix: 'indie pop, bedroom pop, acoustic guitar, intimate, lo-fi',
    suno_style_suffix: 'authentic emotion, relatable',
    reference_artists: ['Conan Gray', 'Gracie Abrams', 'Joji', 'Ricky Montgomery'],
    reference_tracks: ['Heather', 'I Love You, I\'m Sorry', 'Run', 'Line Without a Hook'],
    deezer_genre_id: 152, streams_benchmark: 1000000,
  },
  {
    id: '', genre: 'electronic', display_name: 'Electronic',
    bpm_range: '128-140', typical_key: 'F major', hook_timing: '1:00',
    production_era: '2024 EDM/Progressive', viral_elements: ['festival drop', 'synth leads', 'build and release', 'epic reverb'],
    suno_style_prefix: 'electronic, edm, synth, festival, progressive house',
    suno_style_suffix: 'euphoric energy, main stage ready',
    reference_artists: ['Martin Garrix', 'Kygo', 'Avicii', 'Tiësto'],
    reference_tracks: ['Animals', 'Stole the Show', 'Wake Me Up'],
    deezer_genre_id: 64, streams_benchmark: 3000000,
  },
];

interface GenreDNA {
  id: string;
  genre: string;
  display_name: string;
  bpm_range: string;
  typical_key: string;
  hook_timing: string;
  production_era: string;
  viral_elements: string[];
  suno_style_prefix: string;
  suno_style_suffix: string;
  reference_artists: string[];
  reference_tracks: string[];
  deezer_genre_id: number | null;
  streams_benchmark: number | null;
}

const emptyDNA = (): GenreDNA => ({
  id: '',
  genre: '',
  display_name: '',
  bpm_range: '',
  typical_key: '',
  hook_timing: '0:30',
  production_era: '',
  viral_elements: [],
  suno_style_prefix: '',
  suno_style_suffix: '',
  reference_artists: [],
  reference_tracks: [],
  deezer_genre_id: null,
  streams_benchmark: null,
});

function ArrayEditor({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  const addItem = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput('');
    }
  };
  const removeItem = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  return (
    <div>
      <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((v, i) => (
          <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-xs">
            {v}
            <button onClick={() => removeItem(i)} className="text-white/40 hover:text-white"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())}
          placeholder="Add item + Enter"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
        />
        <button onClick={addItem} className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 hover:text-white text-xs">Add</button>
      </div>
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder = '', type = 'text' }: any) {
  return (
    <div>
      <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(type === 'number' ? (e.target.value ? parseInt(e.target.value) : null) : e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
      />
    </div>
  );
}

export default function AdminSunoEngine() {
  const [genres, setGenres] = useState<GenreDNA[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<GenreDNA | null>(null);
  const [saving, setSaving] = useState(false);
  const [fetchingLive, setFetchingLive] = useState(false);
  const [generatingStyle, setGeneratingStyle] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const fetchGenres = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('suno_genre_dna')
      .select('*')
      .order('display_name', { ascending: true });

    if (!error && data && data.length > 0) {
      setGenres(data as GenreDNA[]);
    } else {
      // Seed with presets
      setGenres(GENRE_PRESETS);
    }
    setLoading(false);
  };

  useEffect(() => { fetchGenres(); }, []);

  const filteredGenres = genres.filter(g =>
    !search || g.display_name?.toLowerCase().includes(search.toLowerCase()) || g.genre?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (g: GenreDNA) => {
    setSelected({ ...g });
    setIsNew(false);
  };

  const handleNew = () => {
    setSelected(emptyDNA());
    setIsNew(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    if (!selected.genre.trim()) { toast.error('Genre name required'); return; }
    setSaving(true);
    const now = new Date().toISOString();
    const payload = {
      ...selected,
      updated_at: now,
    };
    // Remove empty id for insert
    if (!payload.id) delete (payload as any).id;

    const { error } = await supabase
      .from('suno_genre_dna')
      .upsert(payload, { onConflict: 'genre' });

    setSaving(false);
    if (error) {
      toast.error('Save failed', { description: error.message });
    } else {
      toast.success(`Saved ${selected.display_name || selected.genre}`);
      await fetchGenres();
      setIsNew(false);
    }
  };

  const handleTestInSuno = () => {
    if (!selected) return;
    const styleStr = [selected.suno_style_prefix, selected.suno_style_suffix].filter(Boolean).join(', ');
    const url = `https://suno.com/create?style=${encodeURIComponent(styleStr)}`;
    window.open(url, '_blank');
  };

  const handleFetchLive = async () => {
    if (!selected) return;
    setFetchingLive(true);
    try {
      // Call Lambda generate-lyrics action to get Deezer DNA for genre
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://euszgnaahwmdbfdewaky.supabase.co';
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1c3pnbmFhaHdtZGJmZGV3YWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2Njk5NTAsImV4cCI6MjA4OTI0NTk1MH0.oTg96pXF8PraxphGOCszHuP8SoMpCBDXL6C48OrNbEI';
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ action: 'generate-lyrics', genre: selected.genre, fetchDeezerDNA: true }),
      });
      const result = await response.json();
      if (result?.bpm_range) {
        setSelected(prev => prev ? {
          ...prev,
          bpm_range: result.bpm_range ?? prev.bpm_range,
          typical_key: result.typical_key ?? prev.typical_key,
          reference_artists: result.reference_artists ?? prev.reference_artists,
          reference_tracks: result.reference_tracks ?? prev.reference_tracks,
          production_era: result.production_era ?? prev.production_era,
        } : prev);
        toast.success('Live data applied');
      } else {
        toast.info('No live data returned — check Lambda logs');
      }
    } catch {
      toast.error('Failed to fetch live data');
    }
    setFetchingLive(false);
  };

  const handleGenerateStyle = async () => {
    if (!selected) return;
    setGeneratingStyle(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://euszgnaahwmdbfdewaky.supabase.co';
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1c3pnbmFhaHdtZGJmZGV3YWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2Njk5NTAsImV4cCI6MjA4OTI0NTk1MH0.oTg96pXF8PraxphGOCszHuP8SoMpCBDXL6C48OrNbEI';
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          action: 'generate-style',
          genre: selected.genre,
          bpm_range: selected.bpm_range,
          typical_key: selected.typical_key,
          reference_artists: selected.reference_artists,
          viral_elements: selected.viral_elements,
          production_era: selected.production_era,
        }),
      });
      const result = await response.json();
      if (result?.style_string || result?.suno_style_prefix) {
        setSelected(prev => prev ? {
          ...prev,
          suno_style_prefix: result.suno_style_prefix ?? result.style_string ?? prev.suno_style_prefix,
          suno_style_suffix: result.suno_style_suffix ?? prev.suno_style_suffix,
        } : prev);
        toast.success('Suno style generated!');
      } else {
        // Fallback: build a style string from current data
        const autoStyle = [
          selected.genre,
          selected.production_era,
          selected.bpm_range ? `${selected.bpm_range} bpm` : '',
          ...(selected.viral_elements ?? []).slice(0, 3),
        ].filter(Boolean).join(', ');
        setSelected(prev => prev ? { ...prev, suno_style_prefix: autoStyle } : prev);
        toast.info('Auto-generated style from current fields');
      }
    } catch {
      toast.error('Failed to generate style');
    }
    setGeneratingStyle(false);
  };

  const update = (field: keyof GenreDNA, value: any) => {
    setSelected(prev => prev ? { ...prev, [field]: value } : prev);
  };

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#0a0a0a] text-white">
        <AdminNav />
        <main className="flex-1 overflow-auto p-4 md:p-6 ml-0 md:ml-56">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Music2 className="w-6 h-6 text-purple-400" />
              Suno Style Engine
            </h1>
            <p className="text-xs text-white/40 mt-1">Admin-controlled genre DNA for Suno production styles</p>
          </div>

          <div className="flex gap-6 h-[calc(100vh-140px)]">
            {/* Genre List */}
            <div className="w-64 flex flex-col gap-3 shrink-0">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search genres…"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                onClick={handleNew}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                New Genre
              </button>

              {/* List */}
              <div className="flex-1 overflow-y-auto space-y-1">
                {loading ? (
                  <div className="text-xs text-white/30 text-center py-8">Loading…</div>
                ) : filteredGenres.map((g, i) => (
                  <button
                    key={g.id || g.genre}
                    onClick={() => handleSelect(g)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors text-sm ${
                      selected?.genre === g.genre
                        ? 'bg-purple-600/20 text-white border border-purple-500/40'
                        : 'bg-white/[0.03] text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <span>{g.display_name || g.genre}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                  </button>
                ))}
              </div>
            </div>

            {/* Edit Form */}
            <div className="flex-1 overflow-y-auto">
              {selected ? (
                <div className={`${glassCls} space-y-5`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">
                      {isNew ? 'New Genre' : selected.display_name || selected.genre}
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={handleFetchLive}
                        disabled={fetchingLive}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs font-medium"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${fetchingLive ? 'animate-spin' : ''}`} />
                        {fetchingLive ? 'Fetching…' : 'Fetch Live Data'}
                      </button>
                      <button
                        onClick={handleGenerateStyle}
                        disabled={generatingStyle}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-medium"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        {generatingStyle ? 'Generating…' : 'Generate Suno Style'}
                      </button>
                      <button
                        onClick={handleTestInSuno}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Test in Suno
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <FieldInput label="Genre (slug)" value={selected.genre} onChange={(v: string) => update('genre', v)} placeholder="afro house" />
                    <FieldInput label="Display Name" value={selected.display_name} onChange={(v: string) => update('display_name', v)} placeholder="Afro House" />
                    <FieldInput label="BPM Range" value={selected.bpm_range} onChange={(v: string) => update('bpm_range', v)} placeholder="124-130" />
                    <FieldInput label="Typical Key" value={selected.typical_key} onChange={(v: string) => update('typical_key', v)} placeholder="A minor" />
                    <FieldInput label="Hook Timing" value={selected.hook_timing} onChange={(v: string) => update('hook_timing', v)} placeholder="0:20" />
                    <FieldInput label="Production Era" value={selected.production_era} onChange={(v: string) => update('production_era', v)} placeholder="2024 Afrobeats" />
                    <FieldInput label="Deezer Genre ID" value={selected.deezer_genre_id} onChange={(v: any) => update('deezer_genre_id', v)} placeholder="152" type="number" />
                    <FieldInput label="Streams Benchmark" value={selected.streams_benchmark} onChange={(v: any) => update('streams_benchmark', v)} placeholder="2000000" type="number" />
                  </div>

                  {/* Suno Style Strings */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">Suno Style Prefix</label>
                      <textarea
                        value={selected.suno_style_prefix ?? ''}
                        onChange={e => update('suno_style_prefix', e.target.value)}
                        rows={2}
                        placeholder="afro house, african percussion, deep bass, hypnotic groove"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">Suno Style Suffix</label>
                      <textarea
                        value={selected.suno_style_suffix ?? ''}
                        onChange={e => update('suno_style_suffix', e.target.value)}
                        rows={2}
                        placeholder="club ready, dancefloor energy"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500 resize-none"
                      />
                    </div>
                    {selected.suno_style_prefix && (
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-purple-400/60 uppercase tracking-widest mb-1">Preview Style String</p>
                        <p className="text-xs text-white/70 font-mono">
                          {[selected.suno_style_prefix, selected.suno_style_suffix].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Arrays */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ArrayEditor
                      label="Viral Elements"
                      value={selected.viral_elements ?? []}
                      onChange={v => update('viral_elements', v)}
                    />
                    <ArrayEditor
                      label="Reference Artists"
                      value={selected.reference_artists ?? []}
                      onChange={v => update('reference_artists', v)}
                    />
                    <ArrayEditor
                      label="Reference Tracks"
                      value={selected.reference_tracks ?? []}
                      onChange={v => update('reference_tracks', v)}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-white/30">
                  <Music2 className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">Select a genre to edit</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
