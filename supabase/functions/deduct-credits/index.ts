import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId, amount } = await req.json();
    if (!userId || !amount) {
      return new Response(JSON.stringify({ success: false, error: "Missing userId or amount" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get current credits
    const { data: user, error: fetchErr } = await supabase
      .from("viralize_users")
      .select("credits")
      .eq("id", userId)
      .single();

    if (fetchErr || !user) {
      return new Response(JSON.stringify({ success: false, error: "User not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (user.credits < amount) {
      return new Response(JSON.stringify({ success: false, error: "Insufficient credits", credits: user.credits }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Deduct
    const newCredits = user.credits - amount;
    const { error: updateErr } = await supabase
      .from("viralize_users")
      .update({ credits: newCredits })
      .eq("id", userId);

    if (updateErr) {
      return new Response(JSON.stringify({ success: false, error: updateErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true, credits: newCredits, deducted: amount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
