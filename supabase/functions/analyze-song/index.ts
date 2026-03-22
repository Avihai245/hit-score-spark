/**
 * analyze-song — AI-powered hit comparison engine
 *
 * Takes a Lambda raw analysis + audio features, fetches the real viral DNA
 * for the song's genre from `viral_dna_cache` (populated by scan-hits),
 * then uses Claude to produce a deep, accurate hit score and actionable advice.
 *
 * POST /functions/v1/analyze-song
 * Body: {
 *   lambdaResult: object,   // raw output from AWS Lambda analyze endpoint
 *   title: string,
 *   genre: string,
 *   goal: string,
 *   userId?: string,
 * }
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
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
      max_tokens: 2000,
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

// ── Score computation: compare song features vs viral DNA ─────────────────────

function computeBaseScore(song: Record<string, any>, dna: Record<string, any>): number {
  if (!dna || !song) return 50;

  let score = 0;
  let weight = 0;

  const compare = (songVal: number | null, dnaAvg: number | null, w: number, tolerance: number) => {
    if (songVal == null || dnaAvg == null) return;
    const diff = Math.abs(songVal - dnaAvg);
    const proximity = Math.max(0, 1 - diff / tolerance);
    score += proximity * w;
    weight += w;
  };

  // BPM: ±15 BPM is "in range"
  compare(song.bpmEstimate || song.bpm, dna.avg_bpm, 20, 15);
  // Energy: ±0.2 range
  compare(song.energyLevel != null ? song.energyLevel / 10 : null, dna.avg_energy, 20, 0.2);
  // Danceability: ±0.2
  compare(song.danceability != null ? song.danceability / 10 : null, dna.avg_danceability, 15, 0.2);
  // Valence: ±0.25
  compare(song.valence != null ? song.valence / 10 : null, dna.avg_valence, 10, 0.25);
  // Acousticness: ±0.3
  compare(song.acousticness != null ? song.acousticness / 10 : null, dna.avg_acousticness, 10, 0.3);

  const rawScore = weight > 0 ? (score / weight) * 100 : 50;

  // Blend: 60% data-driven + 40% from Lambda's own score (if available)
  const lambdaScore = song.score ?? 50;
  return Math.round(rawScore * 0.6 + lambdaScore * 0.4);
}

// ── DNA scores breakdown ──────────────────────────────────────────────────────

function buildDnaScores(song: Record<string, any>, dna: Record<string, any>, finalScore: number) {
  const toTen = (v: number | null, fallback: number) =>
    v != null ? Math.min(10, Math.max(1, Math.round(v * 10))) : fallback;

  const dnaObj = dna?.dna || dna || {};

  // Get values from song (Lambda may return 0-1 or 0-10 depending on version)
  const normalize = (v: any) => v != null ? (v > 1 ? v / 10 : v) : null;

  const energy       = normalize(song.energyLevel)  ?? normalize(dnaObj.energy?.avg)      ?? 0.5;
  const danceability = normalize(song.danceability)  ?? normalize(dnaObj.danceability?.avg) ?? 0.5;
  const valence      = normalize(song.valence)        ?? normalize(dnaObj.valence?.avg)      ?? 0.5;
  const competitor   = song.competitorMatch != null ? song.competitorMatch / 10 : finalScore / 100;

  return [
    { label: "Hook Strength",     value: Math.min(10, Math.round(finalScore * 0.1 + competitor * 3 + 1)),  max: 10 },
    { label: "Replay Value",      value: Math.min(10, Math.round(danceability * 5 + valence * 3 + finalScore * 0.02)), max: 10 },
    { label: "Emotional Impact",  value: toTen(valence, Math.round(finalScore / 10)),  max: 10 },
    { label: "Structure Quality", value: Math.min(10, Math.round(finalScore * 0.08 + (song.hookTiming ? 2 : 0) + 1)), max: 10 },
    { label: "Market Fit",        value: Math.min(10, Math.max(1, Math.round(competitor * 10))), max: 10 },
    { label: "Platform Readiness",value: Math.min(10, Math.round(energy * 4 + danceability * 3 + finalScore * 0.03)), max: 10 },
  ];
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json();
    const { lambdaResult, title, genre, goal, userId } = body;

    if (!lambdaResult) {
      return new Response(JSON.stringify({ error: "lambdaResult is required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

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

    // 4. Claude analysis — deep hit comparison
    const systemPrompt = `You are the world's top music A&R consultant and hit-maker analyst.
You have analyzed over 1 million songs and know exactly what separates a viral hit from a missed opportunity.
Your analysis is based on REAL data from Spotify's top charts.
Be specific, direct, and actionable. No fluff. Respond ONLY with valid JSON.`;

    const userPrompt = `Analyze this song against real chart data and return a JSON object.

SONG:
- Title: "${title || lambdaResult.title || 'Untitled'}"
- Genre: ${effectiveGenre}
- Goal: ${goal || "maximize streams"}
- BPM: ${lambdaResult.bpmEstimate || lambdaResult.bpm || "unknown"}
- Energy: ${lambdaResult.energyLevel || "unknown"}/10
- Danceability: ${lambdaResult.danceability || "unknown"}/10
- Hook timing: ${lambdaResult.hookTiming || "unknown"}
- Lambda score: ${lambdaResult.score || 50}/100
- Lambda verdict: ${lambdaResult.verdict || "N/A"}
- Lambda strengths: ${JSON.stringify(lambdaResult.strengths || [])}
- Lambda improvements: ${JSON.stringify(lambdaResult.improvements || [])}

REAL ${effectiveGenre.toUpperCase()} HIT DNA (from ${dna?.track_count || 0} Spotify top tracks):
- Avg BPM: ${dna?.avg_bpm?.toFixed(1) || "N/A"}
- Avg Energy: ${dna?.avg_energy?.toFixed(3) || "N/A"}
- Avg Danceability: ${dna?.avg_danceability?.toFixed(3) || "N/A"}
- Avg Valence: ${dna?.avg_valence?.toFixed(3) || "N/A"}
- Avg Loudness: ${dna?.avg_loudness?.toFixed(1) || "N/A"} dBFS
- Top Keys: ${JSON.stringify(dna?.top_keys || [])}
- Avg Popularity: ${dna?.avg_popularity?.toFixed(0) || "N/A"}/100

TOP ${effectiveGenre.toUpperCase()} HITS ON SPOTIFY RIGHT NOW:
${(topHits || []).map(h => `- "${h.title}" by ${h.artist} (popularity: ${h.popularity}, BPM: ${h.bpm?.toFixed(0)}, energy: ${h.energy?.toFixed(2)})`).join("\n") || "No data yet — use available context"}

DATA-DRIVEN BASE SCORE: ${baseScore}/100

Return ONLY this JSON (no markdown, no extra text):
{
  "score": <integer 0-100, your final assessment blending data + musical judgment>,
  "verdict": "<2-3 sentence verdict that references actual hit data comparisons>",
  "strengths": ["<specific strength 1 with data reference>", "<strength 2>", "<strength 3>"],
  "improvements": ["<specific fix 1 with data reference>", "<fix 2>", "<fix 3>", "<fix 4>"],
  "oneChange": "<single most impactful change the artist should make TODAY>",
  "hookAnalysis": "<detailed analysis of hook timing and strength — reference the 0:07 decision window>",
  "viralPotential": "<TikTok/Instagram Reels potential — reference current viral sound patterns>",
  "competitorMatch": <integer 1-10, how closely this matches current chart hits>,
  "emotionalCore": "<what emotion drives this song and how well it's executed>",
  "viralLine": "<the single most memorable lyric or musical moment — or 'none yet' if unclear>",
  "marketInsight": "<1 specific thing about the current ${effectiveGenre} market this artist should know>",
  "similarHits": ["<hit song this reminds you of 1>", "<hit song 2>"],
  "dataSource": "real_spotify_comparison"
}`;

    const claudeResponse = await callClaude(anthropicKey, systemPrompt, userPrompt);

    // Parse Claude's JSON response
    let analysis: Record<string, any>;
    try {
      // Strip markdown code blocks if present
      const clean = claudeResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(clean);
    } catch {
      // Claude returned non-JSON — wrap it gracefully
      console.error("Claude JSON parse failed, raw:", claudeResponse.slice(0, 500));
      analysis = {
        score: baseScore,
        verdict: claudeResponse.slice(0, 200),
        strengths: lambdaResult.strengths || [],
        improvements: lambdaResult.improvements || [],
        oneChange: lambdaResult.oneChange || "",
        hookAnalysis: lambdaResult.hookAnalysis || "",
        viralPotential: lambdaResult.viralPotential || "",
        competitorMatch: lambdaResult.competitorMatch || 5,
        emotionalCore: lambdaResult.emotionalCore || "",
        viralLine: lambdaResult.viralLine || "",
        dataSource: "real_spotify_comparison",
      };
    }

    // 5. Build final enriched result
    const finalScore = analysis.score ?? baseScore;
    const dnaScores = buildDnaScores(
      { ...lambdaResult, competitorMatch: analysis.competitorMatch },
      dna,
      finalScore,
    );

    const enrichedResult = {
      // Merge Lambda fields (audio features etc.) with Claude analysis
      ...lambdaResult,
      ...analysis,
      score: finalScore,
      dna: dnaScores,
      // Viral DNA context for UI
      genreDna: {
        genre: effectiveGenre,
        trackCount: dna?.track_count || 0,
        avgBpm: dna?.avg_bpm,
        avgEnergy: dna?.avg_energy,
        avgDanceability: dna?.avg_danceability,
        avgValence: dna?.avg_valence,
        topKeys: dna?.top_keys || [],
        avgPopularity: dna?.avg_popularity,
        topHits: (topHits || []).map(h => h.title + " – " + h.artist),
      },
      dataSource: "real_spotify_comparison",
    };

    // 6. Update Supabase analysis record with enriched result (if we have analysisId or userId)
    const { analysisId } = body;
    if (analysisId) {
      await supabase
        .from("viralize_analyses")
        .update({
          score: finalScore,
          verdict: analysis.verdict,
          full_result: enrichedResult,
          genre: effectiveGenre,
        })
        .eq("id", analysisId);
    }

    return new Response(JSON.stringify(enrichedResult), {
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
