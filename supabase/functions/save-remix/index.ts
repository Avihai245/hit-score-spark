/**
 * save-remix — saves a completed Suno generation to viralize_remixes
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY so it bypasses RLS entirely.
 * This is needed because the frontend Supabase client may not have
 * the correct session token or the RLS INSERT policy may not be set.
 *
 * POST /functions/v1/save-remix
 * Body: {
 *   userId: string,
 *   analysisId?: string | null,
 *   audioUrl: string,
 *   imageUrl?: string | null,
 *   sunoTaskId?: string,
 *   genre?: string,
 *   originalTitle?: string,
 *   remixTitle?: string,
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json();
    const {
      userId,
      analysisId,
      audioUrl,
      imageUrl,
      sunoTaskId,
      genre,
      originalTitle,
      remixTitle,
    } = body;

    if (!userId || !audioUrl) {
      return new Response(
        JSON.stringify({ error: "userId and audioUrl are required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Deduplicate: check if already saved
    const { data: existing } = await supabase
      .from("viralize_remixes")
      .select("id")
      .eq("user_id", userId)
      .eq("audio_url", audioUrl)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ id: existing[0].id, duplicate: true }),
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Insert new remix
    const { data: inserted, error: insertErr } = await supabase
      .from("viralize_remixes")
      .insert({
        user_id: userId,
        analysis_id: analysisId || null,
        audio_url: audioUrl,
        image_url: imageUrl || null,
        suno_task_id: sunoTaskId || null,
        genre: genre || null,
        original_title: originalTitle || null,
        remix_title: remixTitle || null,
        status: "complete",
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("save-remix INSERT error:", insertErr.message, insertErr.code);
      return new Response(
        JSON.stringify({ error: insertErr.message }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ id: inserted?.id }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("save-remix error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
