/**
 * Spotify integration via Lambda token proxy
 * Lambda generates the token, browser calls Spotify directly (no AWS IP block)
 */

const LAMBDA_URL = import.meta.env.VITE_LAMBDA_URL || 'https://u2yjblp3w5.execute-api.eu-west-1.amazonaws.com/prod/analyze';

const GENRE_SEED_MAP: Record<string, string> = {
  'pop': 'pop',
  'hip hop': 'hip-hop',
  'hip-hop': 'hip-hop',
  'r&b': 'r-n-b',
  'rnb': 'r-n-b',
  'electronic': 'electronic',
  'edm': 'edm',
  'indie': 'indie-pop',
  'indie pop': 'indie-pop',
  'latin': 'latin',
  'rock': 'rock',
  'country': 'country',
  'dance': 'dance',
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getSpotifyToken(): Promise<string | null> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }
  try {
    const res = await fetch(LAMBDA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'spotify-token' }),
    });
    const data = await res.json();
    if (data.token) {
      cachedToken = { token: data.token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

export interface SpotifySong {
  name: string;
  artist: string;
  popularity: number;
  url: string;
  image: string;
  preview_url?: string;
}

export async function getTopSongsByGenre(genre: string, limit = 10): Promise<SpotifySong[]> {
  const token = await getSpotifyToken();
  if (!token) return [];

  const g = genre.toLowerCase();
  const seedGenre = Object.entries(GENRE_SEED_MAP).find(([k]) => g.includes(k))?.[1] || 'pop';

  try {
    // Browser calls Spotify directly — no IP block
    const res = await fetch(
      `https://api.spotify.com/v1/recommendations?seed_genres=${seedGenre}&limit=${limit}&market=US&min_popularity=55`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      console.warn('Spotify API error:', res.status);
      return [];
    }
    const data = await res.json();
    return (data.tracks || [])
      .map((t: any) => ({
        name: t.name,
        artist: t.artists[0]?.name || '',
        popularity: t.popularity,
        url: t.external_urls?.spotify || '',
        image: t.album?.images?.[0]?.url || '',
        preview_url: t.preview_url || null,
      }))
      .sort((a: SpotifySong, b: SpotifySong) => b.popularity - a.popularity);
  } catch {
    return [];
  }
}
