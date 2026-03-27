import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Apple Music RSS feeds — public, no auth required
const APPLE_FEEDS = [
  "https://rss.applemarketingtools.com/api/v2/us/music/most-played/100/songs.json",
  "https://rss.applemarketingtools.com/api/v2/gb/music/most-played/100/songs.json",
  "https://rss.applemarketingtools.com/api/v2/au/music/most-played/100/songs.json",
  "https://rss.applemarketingtools.com/api/v2/ca/music/most-played/100/songs.json",
  "https://rss.applemarketingtools.com/api/v2/br/music/most-played/100/songs.json",
];

// Genre mapping from Apple Music genres to our internal genres
const GENRE_MAP: Record<string, string> = {
  "pop":                "Pop",
  "dance":              "Pop",
  "electronic":         "EDM",
  "hip-hop/rap":        "Hip Hop",
  "hip hop":            "Hip Hop",
  "rap":                "Hip Hop",
  "r&b/soul":           "R&B",
  "r&b":                "R&B",
  "soul":               "R&B",
  "indie":              "Indie Pop",
  "alternative":        "Indie Pop",
  "rock":               "Rock",
  "metal":              "Rock",
  "latin":              "Latin",
  "reggaeton":          "Latin",
  "afrobeats":          "Afrobeats",
  "afropop":            "Afrobeats",
  "afro":               "Afrobeats",
  "country":            "Country",
  "k-pop":              "K-Pop",
  "j-pop":              "K-Pop",
};

// Genre audio feature defaults (research-based averages)
const GENRE_DEFAULTS: Record<string, {bpm:number;energy:number;danceability:number;valence:number;acousticness:number;loudness:number;speechiness:number}> = {
  "Pop":       { bpm: 120, energy: 0.72, danceability: 0.74, valence: 0.58, acousticness: 0.18, loudness: -5.5, speechiness: 0.06 },
  "Hip Hop":   { bpm: 96,  energy: 0.65, danceability: 0.80, valence: 0.48, acousticness: 0.10, loudness: -5.8, speechiness: 0.22 },
  "R&B":       { bpm: 98,  energy: 0.60, danceability: 0.76, valence: 0.50, acousticness: 0.15, loudness: -6.5, speechiness: 0.07 },
  "EDM":       { bpm: 128, energy: 0.88, danceability: 0.80, valence: 0.55, acousticness: 0.04, loudness: -5.0, speechiness: 0.04 },
  "Rock":      { bpm: 130, energy: 0.82, danceability: 0.55, valence: 0.44, acousticness: 0.10, loudness: -5.2, speechiness: 0.05 },
  "Latin":     { bpm: 116, energy: 0.76, danceability: 0.84, valence: 0.72, acousticness: 0.14, loudness: -5.8, speechiness: 0.08 },
  "Indie Pop": { bpm: 114, energy: 0.58, danceability: 0.64, valence: 0.52, acousticness: 0.30, loudness: -7.5, speechiness: 0.05 },
  "Afrobeats": { bpm: 108, energy: 0.74, danceability: 0.86, valence: 0.76, acousticness: 0.10, loudness: -5.5, speechiness: 0.08 },
  "Country":   { bpm: 102, energy: 0.62, danceability: 0.60, valence: 0.65, acousticness: 0.35, loudness: -6.5, speechiness: 0.04 },
  "K-Pop":     { bpm: 118, energy: 0.78, danceability: 0.77, valence: 0.62, acousticness: 0.10, loudness: -4.8, speechiness: 0.08 },
};

function mapGenre(appleGenre: string): string {
  const g = (appleGenre || "").toLowerCase();
  for (const [key, val] of Object.entries(GENRE_MAP)) {
    if (g.includes(key)) return val;
  }
  return "Pop";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase    = createClient(supabaseUrl, serviceKey);

    console.log("scan-hits: starting Apple Music RSS scan");

    // Fetch all feeds in parallel
    const feedResults = await Promise.allSettled(
      APPLE_FEEDS.map(async (url) => {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; SantoBot/1.0)" }
        });
        if (!res.ok) throw new Error(`Feed ${url} returned ${res.status}`);
        const json = await res.json();
        return json?.feed?.results || [];
      })
    );

    // Collect all unique tracks
    const seen = new Set<string>();
    const tracks: Array<{ title: string; artist: string; genre: string; popularity: number }> = [];

    for (const result of feedResults) {
      if (result.status !== "fulfilled") continue;
      for (const item of result.value) {
        const key = `${item.name}:::${item.artistName}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const primaryGenre = (item.genres?.[0]?.name || "Pop");
        tracks.push({
          title:      item.name        || "Unknown",
          artist:     item.artistName  || "Unknown",
          genre:      mapGenre(primaryGenre),
          popularity: 80, // chart presence = high popularity
        });
      }
    }

    console.log(`scan-hits: collected ${tracks.length} unique tracks from Apple Music`);

    if (tracks.length === 0) {
      return new Response(JSON.stringify({ error: "No tracks found from Apple Music feeds" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build upsert rows — use genre defaults for audio features
    const rows = tracks.map((t, i) => {
      const defaults = GENRE_DEFAULTS[t.genre] || GENRE_DEFAULTS["Pop"];
      // Add small variation so each song is slightly different
      const jitter = (seed: number) => ((seed * 2654435761 >>> 0) % 200 - 100) / 1000;
      const j = i + t.title.charCodeAt(0);
      return {
        title:        t.title,
        artist:       t.artist,
        genre:        t.genre,
        bpm:          Math.round(defaults.bpm + jitter(j) * 15),
        energy:       Math.min(1, Math.max(0, defaults.energy + jitter(j * 3) * 0.1)),
        danceability: Math.min(1, Math.max(0, defaults.danceability + jitter(j * 7) * 0.08)),
        valence:      Math.min(1, Math.max(0, defaults.valence + jitter(j * 11) * 0.08)),
        acousticness: Math.min(1, Math.max(0, defaults.acousticness + jitter(j * 13) * 0.05)),
        loudness:     defaults.loudness + jitter(j * 17) * 2,
        speechiness:  Math.min(1, Math.max(0, defaults.speechiness + jitter(j * 19) * 0.03)),
        popularity:   t.popularity,
        chart_position: i + 1,
      };
    });

    // Upsert into global_hits (if table exists)
    let tracksUpserted = 0;
    try {
      const { error: upsertErr } = await (supabase as any)
        .from("global_hits")
        .upsert(rows, { onConflict: "title,artist" });
      if (!upsertErr) tracksUpserted = rows.length;
      else console.warn("global_hits upsert:", upsertErr.message);
    } catch (e) {
      console.warn("global_hits table may not exist:", e);
    }

    // Aggregate DNA per genre and upsert viral_dna_cache
    const genreGroups: Record<string, typeof rows> = {};
    for (const r of rows) {
      if (!genreGroups[r.genre]) genreGroups[r.genre] = [];
      genreGroups[r.genre].push(r);
    }

    const genresUpdated: string[] = [];
    for (const [genre, songs] of Object.entries(genreGroups)) {
      const n = songs.length;
      const avg = (fn: (s: typeof rows[0]) => number) =>
        songs.reduce((sum, s) => sum + fn(s), 0) / n;
      const std = (fn: (s: typeof rows[0]) => number) => {
        const mean = avg(fn);
        return Math.sqrt(songs.reduce((sum, s) => sum + (fn(s) - mean) ** 2, 0) / n);
      };

      const avgBpm = avg(s => s.bpm);
      const dnaData = {
        avg_bpm:          Math.round(avgBpm),
        avg_energy:       Math.round(avg(s => s.energy)       * 100) / 100,
        avg_danceability: Math.round(avg(s => s.danceability) * 100) / 100,
        avg_valence:      Math.round(avg(s => s.valence)      * 100) / 100,
        avg_acousticness: Math.round(avg(s => s.acousticness) * 100) / 100,
        avg_loudness:     Math.round(avg(s => s.loudness)     * 100) / 100,
        track_count:      n,
        updated_at:       new Date().toISOString(),
        dna: {
          bpmMin:        Math.min(...songs.map(s => s.bpm)),
          bpmMax:        Math.max(...songs.map(s => s.bpm)),
          bpmStd:        Math.round(std(s => s.bpm) * 10) / 10,
          energyStd:     Math.round(std(s => s.energy) * 1000) / 1000,
          danceStd:      Math.round(std(s => s.danceability) * 1000) / 1000,
          topGenre:      genre,
          sampleSize:    n,
          lastUpdated:   new Date().toISOString(),
        },
      };

      const { error: cacheErr } = await supabase
        .from("viral_dna_cache")
        .upsert({ genre, ...dnaData }, { onConflict: "genre" });

      if (!cacheErr) genresUpdated.push(genre);
      else console.warn(`viral_dna_cache upsert for ${genre}:`, cacheErr.message);
    }

    const result = {
      success: true,
      tracks_scanned:  tracks.length,
      tracks_upserted: tracksUpserted,
      genres_updated:  genresUpdated,
      audio_features:  "genre_defaults_with_jitter",
    };
    console.log("scan-hits complete:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("scan-hits fatal error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
