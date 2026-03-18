/**
 * Local storage helpers for remix songs.
 * Acts as a reliable fallback when Supabase is unavailable.
 */

const LS_KEY = (uid: string) => `viralize_remixes_${uid}`;

export interface LocalRemix {
  id: string;
  remix_title: string;
  original_title?: string | null;
  audio_url: string;
  image_url?: string | null;
  genre?: string | null;
  created_at: string;
  analysis_id?: string | null;
  suno_task_id?: string | null;
  description?: string;
  accent?: string;
  _isLocal?: boolean; // flag to distinguish from Supabase rows
}

export const saveRemixesToLocalStorage = (userId: string, songs: LocalRemix[]): void => {
  try {
    const existing: LocalRemix[] = JSON.parse(localStorage.getItem(LS_KEY(userId)) || '[]');
    // Deduplicate by suno_task_id+remix_title
    const merged = [...songs, ...existing].filter((song, idx, arr) =>
      arr.findIndex(s => s.suno_task_id === song.suno_task_id && s.remix_title === song.remix_title) === idx
    ).slice(0, 100);
    localStorage.setItem(LS_KEY(userId), JSON.stringify(merged));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
};

export const loadRemixesFromLocalStorage = (userId: string): LocalRemix[] => {
  try {
    const items: LocalRemix[] = JSON.parse(localStorage.getItem(LS_KEY(userId)) || '[]');
    return items.map(item => ({ ...item, _isLocal: true }));
  } catch {
    return [];
  }
};

export const clearLocalRemix = (userId: string, id: string): void => {
  try {
    const existing: LocalRemix[] = JSON.parse(localStorage.getItem(LS_KEY(userId)) || '[]');
    localStorage.setItem(LS_KEY(userId), JSON.stringify(existing.filter(r => r.id !== id)));
  } catch {}
};
