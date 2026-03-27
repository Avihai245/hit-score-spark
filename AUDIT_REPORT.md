# Santo / Viralize — Production Audit Report
Date: 2026-03-27
Auditor: Elon (OpenClaw)
Branch: claude/stripe-integration-setup-w50gB

---

## ✅ Verified Working

- **Lambda scan pipeline** — `get-upload-url` → S3 upload → `analyze` → `poll` flow intact
- **analyze-song edge function** — Claude integration, viral DNA fetch, fallback score, sunoPrompt generation all present
- **save-remix edge function** — receives `userId`, `audioUrl`, `analysisId`, deduplicates, inserts with service_role. No bugs found.
- **handleCreate s3Key resolution** — `full_result.s3Key` → `lastScanS3Key` → extractS3Key(audioUrl). Correct priority order.
- **sunoVersion default** — hardcoded `'v5'` ✅
- **Suno save flow** — after polling complete, calls `save-remix` edge function for each track. Includes `userId`, `analysisId`, `audioUrl`, `genre`, labels. ✅
- **Pending generation resume** — localStorage-backed resume on navigation, also calls `save-remix`. ✅
- **viral_dna_cache** — fetched by genre in analyze-song with fallback to any genre. ✅

---

## 🔧 Fixed

### Fix 1 — Transcript priority in Lyrics Editor
**File:** `src/pages/dashboard/index.tsx`
**Problem:** `useEffect` on `activeItem` set `createLyrics` to `improvedLyrics` (AI-generated) even when AssemblyAI produced a real transcript. Real transcript was stored as `originalLyrics` with `lyricsSource === 'transcribed'` but was overridden by AI lyrics.
**Fix (additive):** Added check for `lyricsSource === 'transcribed'` — real transcript now takes priority over AI-generated lyrics.

### Fix 2 — Auto-fill lyrics editor immediately after scan
**File:** `src/pages/dashboard/index.tsx`
**Problem:** After `handleAnalyze` completes, lyrics editor was only filled via the `activeItem` useEffect (async, requires re-render). If `createLyrics` was empty, there was a brief window where lyrics weren't available.
**Fix (additive):** Added direct `setCreateLyrics` call in `handleAnalyze` Step 4, after enriched data is ready. Only fills if editor is currently empty. Respects transcript > AI lyrics priority.

### Fix 3 — sunoPrompt was sent as customLyrics (wrong field)
**File:** `src/pages/dashboard/index.tsx`
**Problem:** `effectiveLyrics = createLyrics.trim() || fr.sunoPrompt || autoPrompt` — when `createLyrics` was empty, `fr.sunoPrompt` (a style/production directive like "Pop hit song, 120 BPM, strong hook...") was sent as `customLyrics`. Suno treats `customLyrics` as actual song lyrics, not style guidance — this caused Suno to use production notes as the song's text.
**Fix (additive):**
- `effectiveLyrics` = `createLyrics.trim()` OR `fr.originalLyrics` (actual lyrics only)
- New `effectiveSunoPrompt` = `fr.sunoPrompt || fr.sunoPromptFaithful || autoPrompt`
- `sunoPrompt` sent as dedicated field in Lambda payload alongside `customLyrics`

### Fix 4 — analyze-song: dedicated DB columns not populated
**File:** `supabase/functions/analyze-song/index.ts`
**Problem:** INSERT and UPDATE to `viralize_analyses` only wrote `full_result` (jsonb). The dedicated columns `suno_prompt` and `ai_transcript` were never populated, making direct DB queries and dashboard reads unreliable (had to dig into `full_result` jsonb).
**Fix (additive):** Added `suno_prompt` and `ai_transcript` to both INSERT and UPDATE payloads:
- `suno_prompt` = `enrichedResult.sunoPrompt`
- `ai_transcript` = `enrichedResult.originalLyrics` only when `lyricsSource === 'transcribed'` (real transcript, not AI-generated)

---

## ⚠️ Needs Human Action

1. **ANTHROPIC_API_KEY** — Must be set in Supabase Dashboard → Project Settings → Edge Functions → Secrets. Without it, Claude never runs and analysis falls back to hash-based scoring. Cannot verify or set from code.

2. **ASSEMBLYAI_API_KEY** — Must be set in same location. Without it, transcription is skipped entirely (`transcriptionPromise` resolves to `""` immediately). Cannot verify or set from code.

3. **Deploy analyze-song to Supabase** — After this fix, the edge function must be manually redeployed:
   ```
   supabase functions deploy analyze-song --project-ref euszgnaahwmdbfdewaky
   ```
   The code change (Fix 4) is in the repo but Supabase runs the deployed version, not the repo version.

4. **suno_prompt and ai_transcript columns** — Verify these columns exist in `viralize_analyses`. If not, run:
   ```sql
   ALTER TABLE viralize_analyses 
   ADD COLUMN IF NOT EXISTS suno_prompt text,
   ADD COLUMN IF NOT EXISTS ai_transcript text;
   ```
   (Cannot verify from this audit — no service role access to run schema inspection.)

---

## ❓ Could Not Verify

- **Live DB state** — No service role key available. Could not run `SELECT` queries to check recent scans for `suno_prompt IS NOT NULL`, `analysis_version`, or `viralize_remixes` rows. RLS blocks anon reads.
- **suno-proxy / transcribe-audio source** — These functions are deployed directly to Supabase and not in this repo. Could not audit their current deployed code.
- **ANTHROPIC_API_KEY / ASSEMBLYAI_API_KEY presence** — Cannot read Supabase secrets programmatically.
- **analysis_version column** — Not seen in any migration file (none in repo). May or may not exist. Fix 4 does not write to it.

---

## Data Flow Summary (Post-Fix)

```
Upload → Lambda analyze → poll complete
  → analyze-song(lambdaResult, s3Key, userId)
      → Claude enrichment → sunoPrompt, gaps, vocalProfile
      → AssemblyAI transcript → originalLyrics (lyricsSource='transcribed')
      → INSERT viralize_analyses: full_result + suno_prompt + ai_transcript ← FIX 4
      → return enrichedResult + analysisId
  → dashboard: setActiveItem with full_result ← triggers useEffect
  → useEffect: if transcribed → setCreateLyrics(originalLyrics) ← FIX 1
  → handleAnalyze Step 4: setCreateLyrics if empty ← FIX 2

Create → handleCreate(activeItem, createLyrics, createStyle)
  → s3Key from full_result.s3Key || lastScanS3Key (no re-upload)
  → effectiveLyrics = createLyrics || originalLyrics (real lyrics only) ← FIX 3
  → effectiveSunoPrompt = sunoPrompt || autoPrompt ← FIX 3
  → Lambda suno-cover: customLyrics=effectiveLyrics, sunoPrompt=effectiveSunoPrompt ← FIX 3
  → poll → complete → tracks
  → save-remix × 2 tracks → viralize_remixes ✅
```
