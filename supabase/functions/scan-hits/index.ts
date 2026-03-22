/**
 * scan-hits — Spotify global chart scanner
 *
 * Scans the Spotify Global Top 50 + Top 200 playlists, fetches audio features
 * for every track, stores them in `global_hits`, then rebuilds `viral_dna_cache`
 * with real aggregated DNA per genre.
 *
 * Trigger: POST /functions/v1/scan-hits
 * Called by: admin cron (weekly) or manually from admin panel
 *
 * Required env vars:
 *   SPOTIFY_CLIENT_ID
 *   SPOTIFY_CLIENT_SECRET
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Spotify Chart Playlists (official Spotify editorial playlists)
const CHART_PLAYLISTS = [
  { id: "37i9dQZEVXbMDoHDwVN2tF", name: "Global Top 50" },
  { id: "37i9dQZEVXbNG2KDcFcKOF", name: "Global Top 200 (songs)" },
  { id: "37i9dQZF1DXcBWIGoYBM5M", name: "Today's Top Hits" },
  { id: "37i9dQZF1DX0XUsuxWHRQd", name: "RapCaviar" },
  { id: "37i9dQZF1DX4dyzvuaRJ0n", name: "mint" },
  { id: "37i9dQZF1DX10zKzsJ2jva", name: "Viva Latino" },
  { id: "37i9dQZF1DX4JAvHpjipBk", name: "New Music Friday" },
];

// Genre keyword → Spotify genre tag mapping
const GENRE_MAP: Record<string, string[]> = {
  "Pop":      ["pop", "dance pop", "electropop", "teen pop"],
  "Hip Hop":  ["hip hop", "rap", "trap", "drill"],
  "R&B":      ["r&b", "soul", "neo soul", "contemporary r&b"],
  "Indie Pop":["indie pop", "indie", "alternative pop", "bedroom pop"],
  "EDM":      ["edm", "electronic", "house", "techno", "trance", "dubstep"],
  "Rock":     ["rock", "alternative rock", "indie rock", "hard rock"],
  "Latin":    ["latin", "reggaeton", "latin pop", "cumbia"],
  "Afrobeats":["afrobeats", "afropop", "afro", "afro house"],
  "Melodic House": ["melodic house", "progressive house", "deep house"],
  "Other":    [],
};

function detectGenre(artistGenres: string[]): string {
  const joined = artistGenres.join(" ").toLowerCase();
  for (const [genre, keywords] of Object.entries(GENRE_MAP)) {
    if (keywords.some(k => joined.includes(k))) return genre;
  }
  return "Other";
}

// ── Spotify Auth ──────────────────────────────────────────────────────────────

async function getSpotifyToken(clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Spotify auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

// ── Spotify API helpers ───────────────────────────────────────────────────────

async function spotifyGet(token: string, path: string) {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Spotify ${path} → ${res.status}: ${err}`);
  }
  return res.json();
}

async function getPlaylistTracks(token: string, playlistId: string): Promise<any[]> {
  const tracks: any[] = [];
  let url = `/playlists/${playlistId}/tracks?limit=50&fields=items(track(id,name,artists,album,popularity,duration_ms)),next`;

  while (url) {
    const data = await spotifyGet(token, url);
    const valid = (data.items || [])
      .map((i: any) => i.track)
      .filter((t: any) => t && t.id && !t.is_local);
    tracks.push(...valid);
    // Spotify returns full next URL, strip base
    url = data.next ? data.next.replace("https://api.spotify.com/v1", "") : null;
  }
  return tracks;
}

async function getAudioFeatures(token: string, ids: string[]): Promise<any[]> {
  const results: any[] = [];
  // Spotify allows max 100 ids per request
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100).join(",");
    const data = await spotifyGet(token, `/audio-features?ids=${chunk}`);
    results.push(...(data.audio_features || []).filter(Boolean));
  }
  return results;
}

async function getArtistGenres(token: string, artistIds: string[]): Promise<Record<string, string[]>> {
  const genreMap: Record<string, string[]> = {};
  for (let i = 0; i < artistIds.length; i += 50) {
    const chunk = artistIds.slice(i, i + 50).join(",");
    const data = await spotifyGet(token, `/artists?ids=${chunk}`);
    for (const artist of (data.artists || [])) {
      if (artist) genreMap[artist.id] = artist.genres || [];
    }
  }
  return genreMap;
}

// ── Viral DNA aggregation ─────────────────────────────────────────────────────

function aggregateDNA(hits: any[]): Record<string, any> {
  if (hits.length === 0) return {};

  const avg = (key: string) => {
    const vals = hits.map(h => h[key]).filter(v => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  // Most common keys
  const keyNames = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const keyCounts: Record<string, number> = {};
  hits.forEach(h => {
    if (h.key != null) {
      const name = keyNames[h.key];
      keyCounts[name] = (keyCounts[name] || 0) + 1;
    }
  });
  const topKeys = Object.entries(keyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  return {
    track_count:      hits.length,
    avg_bpm:          avg("bpm"),
    avg_energy:       avg("energy"),
    avg_danceability: avg("danceability"),
    avg_valence:      avg("valence"),
    avg_acousticness: avg("acousticness"),
    avg_loudness:     avg("loudness"),
    top_keys:         topKeys,
    avg_duration_ms:  avg("duration_ms"),
    avg_popularity:   avg("popularity"),
    // Legacy dna JSON field — full stats for backward compat
    dna: {
      bpm:          { avg: avg("bpm"), min: Math.min(...hits.map(h=>h.bpm||120)), max: Math.max(...hits.map(h=>h.bpm||120)) },
      energy:       { avg: avg("energy") },
      danceability: { avg: avg("danceability") },
      valence:      { avg: avg("valence") },
      acousticness: { avg: avg("acousticness") },
      loudness:     { avg: avg("loudness") },
      speechiness:  { avg: avg("speechiness") },
      top_keys:     topKeys,
      track_count:  hits.length,
      sample_tracks: hits.slice(0, 5).map(h => ({ title: h.title, artist: h.artist, popularity: h.popularity })),
    },
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const clientId     = Deno.env.get("SPOTIFY_CLIENT_ID");
    const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: "SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    console.log("🎵 scan-hits: starting Spotify scan...");
    const token = await getSpotifyToken(clientId, clientSecret);

    // 1. Collect all tracks from all chart playlists (deduplicated by Spotify ID)
    const trackMap = new Map<string, any>();
    for (const playlist of CHART_PLAYLISTS) {
      console.log(`  📋 Scanning playlist: ${playlist.name}`);
      try {
        const tracks = await getPlaylistTracks(token, playlist.id);
        tracks.forEach(t => {
          if (!trackMap.has(t.id)) trackMap.set(t.id, t);
        });
      } catch (e) {
        console.warn(`  ⚠️  Skipped ${playlist.name}: ${e}`);
      }
    }

    const tracks = Array.from(trackMap.values());
    console.log(`  ✅ Collected ${tracks.length} unique tracks`);

    if (tracks.length === 0) {
      return new Response(JSON.stringify({ error: "No tracks found from Spotify" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // 2. Get audio features for all tracks
    const trackIds = tracks.map(t => t.id);
    const features = await getAudioFeatures(token, trackIds);
    const featureMap = new Map(features.map(f => [f.id, f]));

    // 3. Get artist genres
    const artistIds = [...new Set(tracks.flatMap(t => t.artists.map((a: any) => a.id)))];
    const artistGenreMap = await getArtistGenres(token, artistIds as string[]);

    // 4. Build merged records
    const hitRecords = tracks.map(track => {
      const feat = featureMap.get(track.id);
      const mainArtistId = track.artists[0]?.id;
      const artistGenres = artistGenreMap[mainArtistId] || [];
      const genre = detectGenre(artistGenres);

      return {
        spotify_id:       track.id,
        title:            track.name,
        artist:           track.artists.map((a: any) => a.name).join(", "),
        genre,
        popularity:       track.popularity,
        duration_ms:      track.duration_ms,
        chart_source:     "spotify_charts",
        scanned_at:       new Date().toISOString(),
        updated_at:       new Date().toISOString(),
        // Audio features
        bpm:              feat?.tempo     ?? null,
        key:              feat?.key       ?? null,
        mode:             feat?.mode      ?? null,
        danceability:     feat?.danceability ?? null,
        energy:           feat?.energy    ?? null,
        valence:          feat?.valence   ?? null,
        acousticness:     feat?.acousticness ?? null,
        instrumentalness: feat?.instrumentalness ?? null,
        liveness:         feat?.liveness  ?? null,
        speechiness:      feat?.speechiness ?? null,
        loudness:         feat?.loudness  ?? null,
      };
    });

    // 5. Upsert into global_hits
    const BATCH = 100;
    let upserted = 0;
    for (let i = 0; i < hitRecords.length; i += BATCH) {
      const { error } = await supabase
        .from("global_hits")
        .upsert(hitRecords.slice(i, i + BATCH), { onConflict: "spotify_id" });
      if (error) console.error("Upsert error:", error.message);
      else upserted += Math.min(BATCH, hitRecords.length - i);
    }
    console.log(`  ✅ Upserted ${upserted} tracks into global_hits`);

    // 6. Rebuild viral_dna_cache per genre
    const genreGroups: Record<string, any[]> = {};
    hitRecords.forEach(h => {
      if (!genreGroups[h.genre]) genreGroups[h.genre] = [];
      genreGroups[h.genre].push(h);
    });

    for (const [genre, hits] of Object.entries(genreGroups)) {
      const agg = aggregateDNA(hits);
      await supabase
        .from("viral_dna_cache")
        .upsert({ genre, ...agg, updated_at: new Date().toISOString() }, { onConflict: "genre" });
    }
    console.log(`  ✅ Rebuilt viral_dna_cache for ${Object.keys(genreGroups).length} genres`);

    return new Response(JSON.stringify({
      success: true,
      tracks_scanned: tracks.length,
      tracks_upserted: upserted,
      genres_updated: Object.keys(genreGroups),
      genres_track_counts: Object.fromEntries(
        Object.entries(genreGroups).map(([g, h]) => [g, h.length])
      ),
    }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("scan-hits error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
