-- 1. Create SECURITY DEFINER function to check admin status without triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.viralize_users WHERE id = _user_id),
    false
  );
$$;

-- 2. Create SECURITY DEFINER function to get protected fields for update checks
CREATE OR REPLACE FUNCTION public.get_user_protected_fields(_user_id uuid)
RETURNS TABLE(
  p_is_admin boolean,
  p_credits integer,
  p_plan text,
  p_remixes_used integer,
  p_analyses_used integer,
  p_remixes_this_month integer,
  p_analyses_this_month integer,
  p_subscription_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    is_admin,
    credits,
    plan,
    remixes_used,
    analyses_used,
    remixes_this_month,
    analyses_this_month,
    subscription_status
  FROM public.viralize_users
  WHERE id = _user_id;
$$;

-- 3. Fix viralize_users policies
DROP POLICY IF EXISTS "Admins can delete any user" ON public.viralize_users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.viralize_users;
DROP POLICY IF EXISTS "Admins can update any user (protected fields)" ON public.viralize_users;
DROP POLICY IF EXISTS "Users can update own profile safely" ON public.viralize_users;

CREATE POLICY "Admins can delete any user" ON public.viralize_users
  FOR DELETE TO public
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all users" ON public.viralize_users
  FOR SELECT TO public
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update any user (protected fields)" ON public.viralize_users
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can update own profile safely" ON public.viralize_users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND NOT (is_admin IS DISTINCT FROM (SELECT pf.p_is_admin FROM public.get_user_protected_fields(auth.uid()) pf))
    AND NOT (credits IS DISTINCT FROM (SELECT pf.p_credits FROM public.get_user_protected_fields(auth.uid()) pf))
    AND NOT (remixes_used IS DISTINCT FROM (SELECT pf.p_remixes_used FROM public.get_user_protected_fields(auth.uid()) pf))
    AND NOT (analyses_used IS DISTINCT FROM (SELECT pf.p_analyses_used FROM public.get_user_protected_fields(auth.uid()) pf))
    AND NOT (remixes_this_month IS DISTINCT FROM (SELECT pf.p_remixes_this_month FROM public.get_user_protected_fields(auth.uid()) pf))
    AND NOT (analyses_this_month IS DISTINCT FROM (SELECT pf.p_analyses_this_month FROM public.get_user_protected_fields(auth.uid()) pf))
    AND NOT (plan IS DISTINCT FROM (SELECT pf.p_plan FROM public.get_user_protected_fields(auth.uid()) pf))
    AND NOT (subscription_status IS DISTINCT FROM (SELECT pf.p_subscription_status FROM public.get_user_protected_fields(auth.uid()) pf))
  );

-- 4. Fix admin_audit_logs policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
  FOR SELECT TO public
  USING (public.is_admin(auth.uid()));

-- 5. Fix admin_settings policies
DROP POLICY IF EXISTS "Admins can insert settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can view settings" ON public.admin_settings;

CREATE POLICY "Admins can insert settings" ON public.admin_settings
  FOR INSERT TO public
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update settings" ON public.admin_settings
  FOR UPDATE TO public
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view settings" ON public.admin_settings
  FOR SELECT TO public
  USING (public.is_admin(auth.uid()));

-- 6. Fix viral_dna_cache policies
DROP POLICY IF EXISTS "Admins can manage cache" ON public.viral_dna_cache;
CREATE POLICY "Admins can manage cache" ON public.viral_dna_cache
  FOR ALL TO public
  USING (public.is_admin(auth.uid()));

-- 7. Fix viralize_analyses policies
DROP POLICY IF EXISTS "Admins can delete any analysis" ON public.viralize_analyses;
DROP POLICY IF EXISTS "Admins can view all analyses" ON public.viralize_analyses;

CREATE POLICY "Admins can delete any analysis" ON public.viralize_analyses
  FOR DELETE TO public
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all analyses" ON public.viralize_analyses
  FOR SELECT TO public
  USING (public.is_admin(auth.uid()));

-- 8. Fix viralize_remixes policies
DROP POLICY IF EXISTS "Admins can delete any remix" ON public.viralize_remixes;
DROP POLICY IF EXISTS "Admins can view all remixes" ON public.viralize_remixes;

CREATE POLICY "Admins can delete any remix" ON public.viralize_remixes
  FOR DELETE TO public
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all remixes" ON public.viralize_remixes
  FOR SELECT TO public
  USING (public.is_admin(auth.uid()));

-- 9. Fix admin_impersonation_sessions policies
DROP POLICY IF EXISTS "Admins can manage their impersonation sessions" ON public.admin_impersonation_sessions;
CREATE POLICY "Admins can manage their impersonation sessions" ON public.admin_impersonation_sessions
  FOR ALL TO public
  USING (admin_id = auth.uid() AND public.is_admin(auth.uid()))
  WITH CHECK (admin_id = auth.uid() AND public.is_admin(auth.uid()));