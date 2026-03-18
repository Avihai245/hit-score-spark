-- ISSUE 1: admin_impersonation_sessions SELECT policy is too permissive (USING: true)
DROP POLICY IF EXISTS "System can validate impersonation sessions" ON public.admin_impersonation_sessions;

CREATE POLICY "Only admins can read impersonation sessions"
  ON public.admin_impersonation_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid() AND admin_users.is_admin = true
    )
  );

-- ISSUE 2: admin_audit_logs_detailed view is SECURITY DEFINER — recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.admin_audit_logs_detailed;

CREATE VIEW public.admin_audit_logs_detailed
WITH (security_invoker = true)
AS
SELECT
  aal.id,
  aal.admin_id,
  vu.email AS admin_email,
  aal.action,
  aal.target_table,
  aal.target_id,
  aal.changes,
  aal.status,
  aal.error_message,
  aal.ip_address,
  aal.created_at
FROM public.admin_audit_logs aal
LEFT JOIN public.viralize_users vu ON vu.id = aal.admin_id;

-- ISSUE 3: admin_audit_logs INSERT policy too permissive — restrict to authenticated admins
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_logs;

CREATE POLICY "Only admins can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid() AND admin_users.is_admin = true
    )
  );

-- ISSUE 4: Admin update policy on viralize_users allows setting is_admin
DROP POLICY IF EXISTS "Admins can update any user (except is_admin)" ON public.viralize_users;

CREATE POLICY "Admins can update any user (protected fields)"
  ON public.viralize_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid() AND admin_users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid() AND admin_users.is_admin = true
    )
    AND is_admin IS NOT DISTINCT FROM (
      SELECT vu.is_admin FROM public.viralize_users vu WHERE vu.id = viralize_users.id
    )
  );

-- ISSUE 5: User self-update policy should protect sensitive fields
DROP POLICY IF EXISTS "Users can update own profile safely" ON public.viralize_users;

CREATE POLICY "Users can update own profile safely"
  ON public.viralize_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_admin IS NOT DISTINCT FROM (
      SELECT vu.is_admin FROM public.viralize_users vu WHERE vu.id = auth.uid()
    )
    AND credits IS NOT DISTINCT FROM (
      SELECT vu.credits FROM public.viralize_users vu WHERE vu.id = auth.uid()
    )
    AND remixes_used IS NOT DISTINCT FROM (
      SELECT vu.remixes_used FROM public.viralize_users vu WHERE vu.id = auth.uid()
    )
    AND analyses_used IS NOT DISTINCT FROM (
      SELECT vu.analyses_used FROM public.viralize_users vu WHERE vu.id = auth.uid()
    )
    AND remixes_this_month IS NOT DISTINCT FROM (
      SELECT vu.remixes_this_month FROM public.viralize_users vu WHERE vu.id = auth.uid()
    )
    AND analyses_this_month IS NOT DISTINCT FROM (
      SELECT vu.analyses_this_month FROM public.viralize_users vu WHERE vu.id = auth.uid()
    )
    AND plan IS NOT DISTINCT FROM (
      SELECT vu.plan FROM public.viralize_users vu WHERE vu.id = auth.uid()
    )
    AND subscription_status IS NOT DISTINCT FROM (
      SELECT vu.subscription_status FROM public.viralize_users vu WHERE vu.id = auth.uid()
    )
  );

-- ISSUE 6: Fix validate_impersonation_token function search_path
CREATE OR REPLACE FUNCTION public.validate_impersonation_token(token character varying)
 RETURNS TABLE(admin_id uuid, customer_id uuid, is_valid boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.admin_id,
    s.customer_id,
    (s.is_active AND s.expires_at > NOW()) AS is_valid
  FROM admin_impersonation_sessions s
  WHERE s.session_token = token
  LIMIT 1;
END;
$function$;