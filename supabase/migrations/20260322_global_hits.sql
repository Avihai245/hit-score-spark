-- Global hits table: stores real Spotify/chart data for comparison
CREATE TABLE IF NOT EXISTS global_hits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_id    text UNIQUE NOT NULL,
  title         text NOT NULL,
  artist        text NOT NULL,
  genre         text,
  release_date  date,
  popularity    integer,   -- Spotify popularity 0-100
  streams       bigint,

  -- Spotify Audio Features (all 0.0–1.0 unless noted)
  bpm           numeric(6,2),   -- tempo in BPM
  key           integer,        -- 0=C, 1=C#, ... 11=B
  mode          integer,        -- 0=minor, 1=major
  danceability  numeric(4,3),
  energy        numeric(4,3),
  valence       numeric(4,3),   -- positivity
  acousticness  numeric(4,3),
  instrumentalness numeric(4,3),
  liveness      numeric(4,3),
  speechiness   numeric(4,3),
  loudness      numeric(5,2),   -- dBFS, typically -60 to 0
  duration_ms   integer,

  -- Charting metadata
  chart_peak    integer,        -- highest chart position
  chart_source  text DEFAULT 'spotify_global_top50',
  scanned_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Index for fast genre lookups (used in viral DNA computation)
CREATE INDEX IF NOT EXISTS global_hits_genre_idx ON global_hits (genre);
CREATE INDEX IF NOT EXISTS global_hits_popularity_idx ON global_hits (popularity DESC);
CREATE INDEX IF NOT EXISTS global_hits_scanned_at_idx ON global_hits (scanned_at DESC);

-- RLS: read-only for authenticated users, full access for service role
ALTER TABLE global_hits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "global_hits_read" ON global_hits
  FOR SELECT USING (true);

-- Update viral_dna_cache: add more fields for richer comparison
ALTER TABLE viral_dna_cache
  ADD COLUMN IF NOT EXISTS track_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_bpm numeric(6,2),
  ADD COLUMN IF NOT EXISTS avg_energy numeric(4,3),
  ADD COLUMN IF NOT EXISTS avg_danceability numeric(4,3),
  ADD COLUMN IF NOT EXISTS avg_valence numeric(4,3),
  ADD COLUMN IF NOT EXISTS avg_acousticness numeric(4,3),
  ADD COLUMN IF NOT EXISTS avg_loudness numeric(5,2),
  ADD COLUMN IF NOT EXISTS top_keys text[],          -- most common keys e.g. ['C','G','Am']
  ADD COLUMN IF NOT EXISTS avg_duration_ms integer,
  ADD COLUMN IF NOT EXISTS avg_popularity numeric(5,2);

COMMENT ON TABLE global_hits IS 'Real Spotify/chart data scanned weekly. Powers viral DNA comparison.';
COMMENT ON TABLE viral_dna_cache IS 'Aggregated hit DNA per genre. Rebuilt from global_hits weekly.';
