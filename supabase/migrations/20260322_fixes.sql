-- ============================================================
-- Fix 1: Add missing increment_analyses_this_month function
-- (Analyze.tsx calls this RPC but it didn't exist → silent fail)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_analyses_this_month(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.viralize_users
  SET
    analyses_used       = COALESCE(analyses_used, 0) + 1,
    analyses_this_month = COALESCE(analyses_this_month, 0) + 1
  WHERE id = user_id_param;
END;
$$;

-- ============================================================
-- Fix 2: Add missing columns that stripe-webhook tries to write
-- (Missing columns cause silent payment recording failures)
-- ============================================================
ALTER TABLE public.viralize_credits
  ADD COLUMN IF NOT EXISTS price_paid      numeric,
  ADD COLUMN IF NOT EXISTS stripe_price_id text;

ALTER TABLE public.viralize_users
  ADD COLUMN IF NOT EXISTS credits_refreshed_at timestamptz;

-- ============================================================
-- Fix 3: Add missing indexes on user_id for performance
-- (Without these, every "load my data" query does a full scan)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_viralize_analyses_user_id
  ON public.viralize_analyses(user_id);

CREATE INDEX IF NOT EXISTS idx_viralize_remixes_user_id
  ON public.viralize_remixes(user_id);

CREATE INDEX IF NOT EXISTS idx_viralize_remixes_analysis_id
  ON public.viralize_remixes(analysis_id);

CREATE INDEX IF NOT EXISTS idx_viralize_credits_user_id
  ON public.viralize_credits(user_id);

-- ============================================================
-- Fix 4: Grant execute permission on the new function
-- ============================================================
GRANT EXECUTE ON FUNCTION public.increment_analyses_this_month(uuid)
  TO authenticated, service_role;
