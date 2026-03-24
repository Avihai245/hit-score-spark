/**
 * analyze-song v2 — AI-powered hit comparison engine
 *
 * Takes a Lambda raw analysis + audio features, fetches the real viral DNA
 * for the song's genre from `viral_dna_cache` (populated by scan-hits),
 * then uses Claude to produce a deep, accurate hit score and actionable advice.
 *
 * v2 changes:
 * - Each of the 6 DNA scores uses independent features (not all derived from finalScore)
 * - computeBaseScore uses wider tolerances + loudness + speechiness
 * - Claude prompt forces numerical specificity (BPM delta, energy delta, etc.)
 * - Hook timing scoring is position-aware (earlier = better)
 * - 70% data-driven / 30% Lambda blend (was 60/40)
 *
 * POST /functions/v1/analyze-song
 * Body: {
 *   lambdaResult: object,   // raw output from AWS Lambda analyze endpoint
 *   title: string,
 *   genre: string,
 *   goal: string,
 *   userId?: string,
 *   analysisId?: string,
 *   fileSizeBytes?: number,
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Claude API ────────────────────────────────────────────────────────────────

async function callClaude(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.content[0].text;
}

// ── Hook timing score (earlier hook = higher score) ───────────────────────────

function hookTimingScore(hookTiming: string | null | undefined): number {
  if (!hookTiming) return 5;
  // Parse "M:SS" or "SS" format
  const parts = hookTiming.split(":").map(Number);
  const totalSeconds = parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0];
  if (totalSeconds <= 15) return 10;   // Hook by 0:15 — perfect
  if (totalSeconds <= 25) return 8;    // Hook by 0:25 — great
  if (totalSeconds <= 40) return 6;    // Hook by 0:40 — acceptable
  if (totalSeconds <= 60) return 4;    // Hook after 1:00 — too late
  return 2;                             // Hook very late
}

// ── Clamp helper ──────────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(val)));
}

// ── Normalize: convert 0-10 scale to 0-1 ─────────────────────────────────────

function norm(v: any): number | null {
  if (v == null) return null;
  const n = Number(v);
  if (isNaN(n)) return null;
  return n > 1 ? n / 10 : n;
}

// ── Loudness score: -14 LUFS is Spotify target, map to 0-1 ───────────────────

function loudnessScore(loudnessDbfs: number | null | undefined): number {
  if (loudnessDbfs == null) return 0.5;
  // Typical range: -20 to -4 dBFS. Target around -9 to -6 (≈ -14 LUFS integrated)
  const target = -9;
  const distance = Math.abs(loudnessDbfs - target);
  return Math.max(0, 1 - distance / 12);
}

// ── Score computation: compare song features vs viral DNA ─────────────────────

function computeBaseScore(song: Record<string, any>, dna: Record<string, any>): number {
  if (!dna || !song) return 50;

  let score = 0;
  let weight = 0;

  const compare = (songVal: number | null, dnaAvg: number | null, w: number, tolerance: number) => {
    if (songVal == null || dnaAvg == null || tolerance <= 0) return;
    const diff = Math.abs(songVal - dnaAvg);
    const proximity = Math.max(0, 1 - diff / tolerance);
    score += proximity * w;
    weight += w;
  };

  // Use dynamic std-based tolerance if available, else hardcoded fallback
  const bpmTol   = dna.bpm_std   ? Math.max(10, dna.bpm_std * 1.5)   : 20;
  const engTol   = dna.energy_std ? Math.max(0.15, dna.energy_std * 1.5) : 0.25;
  const danceTol = dna.dance_std  ? Math.max(0.15, dna.dance_std * 1.5)  : 0.25;
  const valTol   = dna.valence_std ? Math.max(0.2, dna.valence_std * 1.5) : 0.30;
  const acouTol  = 0.35;

  compare(song.bpmEstimate || song.bpm, dna.avg_bpm, 20, bpmTol);
  compare(norm(song.energyLevel),  dna.avg_energy,        20, engTol);
  compare(norm(song.danceability), dna.avg_danceability,  15, danceTol);
  compare(norm(song.valence),      dna.avg_valence,       10, valTol);
  compare(norm(song.acousticness), dna.avg_acousticness,  10, acouTol);

  // Loudness: compare normalized loudness score (0-1) to genre avg
  const songLoudScore = loudnessScore(song.loudness ?? song.loudnessDbfs);
  const dnaLoudScore  = loudnessScore(dna.avg_loudness);
  compare(songLoudScore, dnaLoudScore, 15, 0.2);

  // Speechiness: if available from Lambda
  if (song.speechiness != null && dna.avg_speechiness != null) {
    compare(norm(song.speechiness), dna.avg_speechiness, 10, 0.15);
  }

  const rawScore = weight > 0 ? (score / weight) * 100 : 50;

  // Blend: 70% data-driven + 30% from Lambda's score
  const lambdaScore = song.score ?? 50;
  return Math.round(rawScore * 0.7 + lambdaScore * 0.3);
}

// ── DNA scores breakdown — each score uses DIFFERENT independent features ─────

function buildDnaScores(song: Record<string, any>, dna: Record<string, any>, finalScore: number) {
  const energy       = norm(song.energyLevel)  ?? 0.5;
  const danceability = norm(song.danceability)  ?? 0.5;
  const valence      = norm(song.valence)        ?? 0.5;
  const speechiness  = norm(song.speechiness)    ?? 0.1;
  const competitor   = song.competitorMatch != null
    ? (song.competitorMatch > 1 ? song.competitorMatch / 10 : song.competitorMatch)
    : finalScore / 100;
  const avgPop       = dna?.avg_popularity != null ? dna.avg_popularity / 100 : 0.7;

  // BPM proximity to genre avg (0-1)
  const songBpm = song.bpmEstimate || song.bpm;
  const bpmProximity = songBpm && dna?.avg_bpm
    ? Math.max(0, 1 - Math.abs(songBpm - dna.avg_bpm) / 20)
    : 0.5;

  // Hook timing quality (position-aware, fully independent)
  const hookQuality = hookTimingScore(song.hookTiming) / 10;

  // Loudness fit
  const lScore = loudnessScore(song.loudness ?? song.loudnessDbfs);

  return [
    {
      label: "Hook Strength",
      // Uses: hookTiming position + competitor match — NO finalScore
      value: clamp(hookQuality * 6 + competitor * 4, 1, 10),
      max: 10,
    },
    {
      label: "Replay Value",
      // Uses: danceability + valence — NO finalScore
      value: clamp(danceability * 6 + valence * 4, 1, 10),
      max: 10,
    },
    {
      label: "Emotional Impact",
      // Uses: valence + speechiness — NO finalScore
      value: clamp(valence * 7 + speechiness * 3, 1, 10),
      max: 10,
    },
    {
      label: "Structure Quality",
      // Uses: BPM proximity to genre + hook timing — NO finalScore
      value: clamp(bpmProximity * 7 + hookQuality * 3, 1, 10),
      max: 10,
    },
    {
      label: "Market Fit",
      // Uses: competitor match + genre avg popularity — NO finalScore
      value: clamp(competitor * 7 + avgPop * 3, 1, 10),
      max: 10,
    },
    {
      label: "Platform Readiness",
      // Uses: energy + danceability + loudness fit — NO finalScore
      value: clamp(energy * 4 + danceability * 3 + lScore * 3, 1, 10),
      max: 10,
    },
  ];
}

// ── AssemblyAI transcription (real speech-to-text from audio file) ────────────

async function transcribeAudio(s3Key: string, aaiKey: string, lambdaUrl: string): Promise<string> {
  // Step 1: Get a signed download URL from Lambda
  const dlRes = await fetch(lambdaUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "get-download-url", s3Key }),
  });
  if (!dlRes.ok) throw new Error(`Lambda get-download-url failed: ${dlRes.status}`);
  const dlJson = await dlRes.json();
  const downloadUrl = dlJson.downloadUrl || dlJson.url;
  if (!downloadUrl) throw new Error("No downloadUrl returned from Lambda");

  // Step 2: Submit to AssemblyAI
  const submitRes = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: { "authorization": aaiKey, "content-type": "application/json" },
    body: JSON.stringify({ audio_url: downloadUrl, language_detection: true }),
  });
  if (!submitRes.ok) throw new Error(`AssemblyAI submit failed: ${submitRes.status}`);
  const { id } = await submitRes.json();
  if (!id) throw new Error("No transcript ID returned from AssemblyAI");

  // Step 3: Poll until done (max 90s — 9 × 10s)
  for (let i = 0; i < 9; i++) {
    await new Promise(r => setTimeout(r, 10000));
    const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: { "authorization": aaiKey },
    });
    if (!pollRes.ok) throw new Error(`AssemblyAI poll failed: ${pollRes.status}`);
    const data = await pollRes.json();
    if (data.status === "completed") return data.text || "";
    if (data.status === "error") throw new Error(`AssemblyAI error: ${data.error}`);
    console.log(`AssemblyAI transcription status: ${data.status} (poll ${i + 1}/9)`);
  }
  throw new Error("AssemblyAI transcription timed out after 90s");
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json();
    const { lambdaResult, title, genre, goal, userId, analysisId, fileSizeBytes, s3Key } = body;

    if (!lambdaResult) {
      return new Response(JSON.stringify({ error: "lambdaResult is required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      console.error("ANTHROPIC_API_KEY not set — returning raw Lambda result");
      return new Response(JSON.stringify({ ...lambdaResult, s3Key: s3Key || null, dataSource: "lambda_only_no_api_key" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 0. Start real lyrics transcription in parallel (non-blocking)
    const assemblyAiKey = Deno.env.get("ASSEMBLYAI_API_KEY");
    const lambdaUrl = Deno.env.get("LAMBDA_URL") || "https://u2yjblp3w5.execute-api.eu-west-1.amazonaws.com/prod/analyze";
    const transcriptionPromise: Promise<string> = (assemblyAiKey && s3Key)
      ? transcribeAudio(s3Key, assemblyAiKey, lambdaUrl).catch(err => {
          console.warn("Transcription failed (non-fatal), will use AI lyrics:", err.message);
          return "";
        })
      : Promise.resolve("");

    // 1. Fetch real viral DNA for this genre
    const effectiveGenre = genre || lambdaResult.genre || "Pop";
    const { data: dnaRow } = await supabase
      .from("viral_dna_cache")
      .select("*")
      .eq("genre", effectiveGenre)
      .maybeSingle();

    // Fallback: if no DNA for exact genre, get any available
    let dna = dnaRow;
    if (!dna) {
      const { data: anyDna } = await supabase
        .from("viral_dna_cache")
        .select("*")
        .order("track_count", { ascending: false })
        .limit(1)
        .maybeSingle();
      dna = anyDna;
    }

    // 2. Compute data-driven base score
    const baseScore = computeBaseScore(lambdaResult, dna);

    // 3. Fetch top 5 comparable hits for context
    const { data: topHits } = await supabase
      .from("global_hits")
      .select("title, artist, popularity, bpm, energy, danceability, valence")
      .eq("genre", effectiveGenre)
      .order("popularity", { ascending: false })
      .limit(5);

    // 4. Pre-compute deltas for Claude prompt specificity
    const songBpm   = lambdaResult.bpmEstimate || lambdaResult.bpm;
    const songEnergy = norm(lambdaResult.energyLevel);
    const songDance  = norm(lambdaResult.danceability);
    const songValence = norm(lambdaResult.valence);
    const songLoudness = lambdaResult.loudness ?? lambdaResult.loudnessDbfs;

    const bpmDelta   = songBpm   && dna?.avg_bpm   ? (songBpm - dna.avg_bpm).toFixed(1)       : null;
    const engDelta   = songEnergy != null && dna?.avg_energy   ? ((songEnergy - dna.avg_energy) * 100).toFixed(1) : null;
    const danceDelta = songDance  != null && dna?.avg_danceability ? ((songDance - dna.avg_danceability) * 100).toFixed(1) : null;

    // Estimate duration from file size (MP3 ~1MB/min at 128kbps, ~2MB/min at 256kbps)
    const durationHint = fileSizeBytes
      ? `~${Math.round(fileSizeBytes / (1024 * 1024 * 1.5))} min estimated`
      : "unknown";

    // 5. Claude analysis — deep hit comparison with forced numerical specificity
    const systemPrompt = `You are the world's top music A&R consultant and hit-maker analyst.
You have analyzed over 1 million songs and know exactly what separates a viral hit from a missed opportunity.
Your analysis is based on REAL data from Spotify's top charts.
Be specific, direct, and actionable. Reference exact numbers. No fluff. Respond ONLY with valid JSON.`;

    const userPrompt = `Analyze this song against real chart data and return a JSON object.

SONG:
- Title: "${title || lambdaResult.title || 'Untitled'}"
- Genre: ${effectiveGenre}
- Goal: ${goal || "maximize streams"}
- Duration: ${durationHint}
- BPM: ${songBpm ?? "unknown"}
- Energy: ${songEnergy != null ? (songEnergy * 10).toFixed(1) : "unknown"}/10
- Danceability: ${songDance != null ? (songDance * 10).toFixed(1) : "unknown"}/10
- Valence: ${songValence != null ? (songValence * 10).toFixed(1) : "unknown"}/10
- Loudness: ${songLoudness != null ? `${songLoudness} dBFS` : "unknown"}
- Hook timing: ${lambdaResult.hookTiming || "unknown"}
- Lambda score: ${lambdaResult.score || 50}/100
- Lambda verdict: ${lambdaResult.verdict || "N/A"}
- Lambda strengths: ${JSON.stringify(lambdaResult.strengths || [])}
- Lambda improvements: ${JSON.stringify(lambdaResult.improvements || [])}

NUMERICAL DELTAS VS GENRE AVERAGE (you MUST reference these in your analysis):
- BPM: ${songBpm ?? "?"} vs genre avg ${dna?.avg_bpm?.toFixed(1) ?? "?"} → ${bpmDelta != null ? `${Number(bpmDelta) > 0 ? "+" : ""}${bpmDelta} BPM` : "N/A"}
- Energy: song ${songEnergy != null ? songEnergy.toFixed(2) : "?"} vs genre avg ${dna?.avg_energy?.toFixed(3) ?? "?"} → ${engDelta != null ? `${Number(engDelta) > 0 ? "+" : ""}${engDelta}%` : "N/A"}
- Danceability: song ${songDance != null ? songDance.toFixed(2) : "?"} vs genre avg ${dna?.avg_danceability?.toFixed(3) ?? "?"} → ${danceDelta != null ? `${Number(danceDelta) > 0 ? "+" : ""}${danceDelta}%` : "N/A"}
- Loudness: ${songLoudness != null ? `${songLoudness} dBFS` : "unknown"} (Spotify target: -14 LUFS ≈ -9 dBFS)
- Hook timing: ${lambdaResult.hookTiming ?? "unknown"} (ideal: within first 0:15)

REAL ${effectiveGenre.toUpperCase()} HIT DNA (from ${dna?.track_count || 0} chart tracks):
- Avg BPM: ${dna?.avg_bpm?.toFixed(1) || "N/A"} (range: ${dna?.bpm_min?.toFixed(0) ?? "?"} – ${dna?.bpm_max?.toFixed(0) ?? "?"})
- Avg Energy: ${dna?.avg_energy?.toFixed(3) || "N/A"}
- Avg Danceability: ${dna?.avg_danceability?.toFixed(3) || "N/A"}
- Avg Valence: ${dna?.avg_valence?.toFixed(3) || "N/A"}
- Avg Loudness: ${dna?.avg_loudness?.toFixed(1) || "N/A"} dBFS
- Avg Popularity: ${dna?.avg_popularity?.toFixed(0) || "N/A"}/100

TOP ${effectiveGenre.toUpperCase()} HITS RIGHT NOW:
${(topHits || []).map(h => `- "${h.title}" by ${h.artist} (popularity: ${h.popularity}, BPM: ${h.bpm?.toFixed(0)}, energy: ${h.energy?.toFixed(2)})`).join("\n") || "No data — use available context"}

DATA-DRIVEN BASE SCORE: ${baseScore}/100

RULES — you MUST follow these:
1. Every strength and improvement MUST cite a specific number (BPM, energy value, timing, etc.)
2. Improvements MUST include target values: "increase BPM from ${songBpm ?? 'X'} to ${dna?.avg_bpm?.toFixed(0) ?? 'Y'}"
3. Score must reflect the numerical deltas — if BPM is far from genre avg, score lower
4. hookAnalysis MUST reference the actual timing "${lambdaResult.hookTiming ?? 'unknown'}" and compare to the 0:15 ideal
5. similarHits must be real songs from the ${effectiveGenre} genre that this reminds you of

Return ONLY this JSON (no markdown, no extra text):
{
  "score": <integer 0-100, your final assessment blending data + musical judgment>,
  "verdict": "<2-3 sentence verdict that references actual BPM/energy numbers from the deltas above>",
  "strengths": ["<specific strength 1 with exact number>", "<strength 2 with exact number>", "<strength 3>"],
  "improvements": ["<fix 1 with specific target value>", "<fix 2 with specific target value>", "<fix 3>", "<fix 4>"],
  "oneChange": "<single most impactful change with specific target: 'bring BPM from X to Y'>",
  "hookAnalysis": "<detailed analysis referencing actual hookTiming value and comparing to 0:15 ideal>",
  "viralPotential": "<TikTok/Instagram Reels potential — reference current viral sound patterns and energy level>",
  "competitorMatch": <integer 1-10, how closely this matches current chart hits>,
  "emotionalCore": "<what emotion this song conveys and how well it's executed based on valence score>",
  "viralLine": "<the single most memorable moment — or 'none identified' if unclear>",
  "marketInsight": "<1 specific current ${effectiveGenre} market insight this artist needs to know>",
  "similarHits": ["<real ${effectiveGenre} hit song 1>", "<real ${effectiveGenre} hit song 2>"],
  "dataSource": "real_chart_comparison"
}`;

    const claudeResponse = await callClaude(anthropicKey, systemPrompt, userPrompt);

    // Parse Claude's JSON response
    let analysis: Record<string, any>;
    try {
      const clean = claudeResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(clean);
    } catch {
      console.error("Claude JSON parse failed, raw:", claudeResponse.slice(0, 500));
      analysis = {
        score: baseScore,
        verdict: claudeResponse.slice(0, 300),
        strengths: lambdaResult.strengths || [],
        improvements: lambdaResult.improvements || [],
        oneChange: lambdaResult.oneChange || "",
        hookAnalysis: lambdaResult.hookAnalysis || "",
        viralPotential: lambdaResult.viralPotential || "",
        competitorMatch: lambdaResult.competitorMatch || 5,
        emotionalCore: lambdaResult.emotionalCore || "",
        viralLine: lambdaResult.viralLine || "",
        dataSource: "real_chart_comparison",
      };
    }

    // 6. Build final enriched result
    const finalScore = analysis.score ?? baseScore;
    const dnaScores = buildDnaScores(
      { ...lambdaResult, competitorMatch: analysis.competitorMatch },
      dna,
      finalScore,
    );

    // Build a unique fingerprint string for this song
    const fingerprint = [
      effectiveGenre.toLowerCase().replace(/\s+/g, "-"),
      songBpm ? `${Math.round(songBpm)}bpm` : null,
      songEnergy != null ? `e${Math.round(songEnergy * 10)}` : null,
      songDance != null ? `d${Math.round(songDance * 10)}` : null,
      songValence != null ? `v${Math.round(songValence * 10)}` : null,
    ].filter(Boolean).join("_");

    const enrichedResult = {
      ...lambdaResult,
      ...analysis,
      score: finalScore,
      baseScore,
      dna: dnaScores,
      similarityFingerprint: fingerprint,
      // Persist s3Key so dashboard can use it for Algorithm Hit creation in future sessions
      s3Key: s3Key || lambdaResult.s3Key,
      // Viral DNA context for UI comparison bars
      genreDna: {
        genre: effectiveGenre,
        trackCount: dna?.track_count || 0,
        avgBpm: dna?.avg_bpm,
        bpmMin: dna?.bpm_min,
        bpmMax: dna?.bpm_max,
        avgEnergy: dna?.avg_energy,
        avgDanceability: dna?.avg_danceability,
        avgValence: dna?.avg_valence,
        avgLoudness: dna?.avg_loudness,
        topKeys: dna?.top_keys || [],
        avgPopularity: dna?.avg_popularity,
        topHits: (topHits || []).map(h => h.title + " – " + h.artist),
      },
      dataSource: "real_chart_comparison",
      s3Key: s3Key || lambdaResult.s3Key || null,
    };

    // 7. Generate AI lyrics (verse + chorus + bridge) based on the full musical analysis
    // These are Claude-composed lyrics matching the song's style — user can edit or replace with real ones
    const lyricsSystemPrompt = `You are a professional hit songwriter with #1 charting credits across Pop, Hip Hop, R&B, and EDM.
Write realistic, singable lyrics that match the musical DNA provided.
The lyrics must feel authentic to the genre and emotionally match the song's energy and valence.
Respond ONLY with valid JSON.`;

    const lyricsUserPrompt = `Write original lyrics for this song and an AI-optimized improved version:

SONG:
- Title: "${title || "Untitled"}"
- Genre: ${effectiveGenre}
- BPM: ${songBpm ?? "unknown"}
- Energy level: ${songEnergy != null ? (songEnergy * 10).toFixed(1) : "unknown"}/10
- Emotional core: ${analysis.emotionalCore || "not specified"}
- Viral hook idea: ${analysis.viralLine || "not specified"}
- Hook analysis: ${analysis.hookAnalysis || "not specified"}
- One key improvement: ${analysis.oneChange || "not specified"}

Write 2 verses + 1 chorus + 1 bridge (total ~16-20 lines).

Return ONLY this JSON:
{
  "originalLyrics": "<verse 1 (4 lines)>\\n\\n<chorus (4 lines)>\\n\\n<verse 2 (4 lines)>\\n\\n<bridge (4 lines)>",
  "improvedLyrics": "<same structure, but stronger hook, more memorable chorus, optimized for virality and ${effectiveGenre} trends>"
}`;

    let lyricsResult = { originalLyrics: "", improvedLyrics: "" };
    try {
      const lyricsRaw = await callClaude(anthropicKey, lyricsSystemPrompt, lyricsUserPrompt);
      const lyricsClean = lyricsRaw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const lyricsParsed = JSON.parse(lyricsClean);
      if (lyricsParsed.originalLyrics) lyricsResult = lyricsParsed;
    } catch (lyricsErr) {
      console.warn("Lyrics generation failed (non-fatal):", lyricsErr);
    }

    // Resolve real transcription — overrides AI-generated lyrics if successful
    const realTranscript = await transcriptionPromise;
    enrichedResult.originalLyrics = realTranscript || lyricsResult.originalLyrics;
    enrichedResult.improvedLyrics = lyricsResult.improvedLyrics;
    enrichedResult.lyricsSource = realTranscript ? "transcribed" : "ai_generated";

    // Build a ready-to-use Suno prompt from analysis data
    enrichedResult.sunoPrompt = [
      `${effectiveGenre} hit song`,
      songBpm ? `${Math.round(songBpm)} BPM` : null,
      lambdaResult.musicalKey ? `key of ${lambdaResult.musicalKey}` : null,
      analysis.emotionalCore ? analysis.emotionalCore.slice(0, 60) : null,
      "strong hook in first 7 seconds",
      analysis.oneChange ? `optimized: ${analysis.oneChange.slice(0, 80)}` : null,
      "radio ready", "viral potential",
    ].filter(Boolean).join(", ");

    console.log(`analyze-song OK: score=${finalScore}, lyrics=${enrichedResult.lyricsSource}, s3Key=${!!enrichedResult.s3Key}, dna=${dnaScores.length}`);

    // 8. Save/update Supabase analysis record (using service_role key — bypasses RLS)
    let effectiveAnalysisId = analysisId || null;

    if (!effectiveAnalysisId && userId) {
      // INSERT new analysis record (first time saving this scan)
      const { data: newRow, error: insertErr } = await supabase
        .from("viralize_analyses")
        .insert({
          user_id: userId,
          title: title || lambdaResult.title || "Untitled",
          genre: effectiveGenre,
          score: finalScore,
          verdict: analysis.verdict || lambdaResult.verdict || "",
          full_result: enrichedResult,
        })
        .select("id")
        .single();
      if (insertErr) {
        console.error("viralize_analyses INSERT error:", insertErr.message, insertErr.code);
      } else if (newRow) {
        effectiveAnalysisId = newRow.id;
        console.log("viralize_analyses inserted id:", effectiveAnalysisId);
      }
    } else if (effectiveAnalysisId) {
      // UPDATE existing record with enriched data
      const { error: updateErr } = await supabase
        .from("viralize_analyses")
        .update({
          score: finalScore,
          verdict: analysis.verdict,
          full_result: enrichedResult,
          genre: effectiveGenre,
        })
        .eq("id", effectiveAnalysisId);
      if (updateErr) {
        console.error("viralize_analyses UPDATE error:", updateErr.message);
      }
    }

    return new Response(JSON.stringify({ ...enrichedResult, analysisId: effectiveAnalysisId }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("analyze-song error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
