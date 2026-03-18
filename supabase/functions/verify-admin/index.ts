/**
 * Edge Function: Verify Admin Access
 * Server-side verification of admin privileges
 *
 * Usage:
 * POST /functions/v1/verify-admin
 * Header: Authorization: Bearer {session_token}
 * Body: { action: "some_action" }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

interface RequestBody {
  action?: string;
}

interface VerifyResponse {
  isAdmin: boolean;
  userId?: string;
  error?: string;
}

Deno.serve(async (req: Request) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return new Response(
        JSON.stringify({
          isAdmin: false,
          error: "Missing authorization token",
        } as VerifyResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials in environment");
      return new Response(
        JSON.stringify({
          isAdmin: false,
          error: "Server configuration error",
        } as VerifyResponse),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token and get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.log("Invalid token:", userError?.message);
      return new Response(
        JSON.stringify({
          isAdmin: false,
          error: "Invalid or expired token",
        } as VerifyResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user exists and is admin
    const { data: profile, error: profileError } = await supabase
      .from("viralize_users")
      .select("id, is_admin, email")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      return new Response(
        JSON.stringify({
          isAdmin: false,
          userId: user.id,
          error: "Profile not found",
        } as VerifyResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!profile?.is_admin) {
      console.log(`Non-admin access attempt by ${profile?.email}`);
      return new Response(
        JSON.stringify({
          isAdmin: false,
          userId: user.id,
          error: "User is not an admin",
        } as VerifyResponse),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // User is admin
    return new Response(
      JSON.stringify({
        isAdmin: true,
        userId: user.id,
      } as VerifyResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({
        isAdmin: false,
        error: "Internal server error",
      } as VerifyResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
