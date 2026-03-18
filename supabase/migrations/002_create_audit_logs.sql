-- Security Migration: Audit Logging System
-- Tracks all administrative actions for compliance and forensics

-- ============================================================================
-- CREATE AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS viralize_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor information
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Action details
  action text NOT NULL,
  resource_type text NOT NULL, -- 'user', 'credits', 'analysis', 'remix', 'subscription', etc
  resource_id text NOT NULL,

  -- Data changes (for audit trail)
  old_value jsonb,
  new_value jsonb,

  -- Request context
  ip_address inet,
  user_agent text,

  -- Metadata
  created_at timestamp DEFAULT now(),

  -- Indexes for performance
  CONSTRAINT audit_logs_action_check CHECK (action ~ '^[a-z_]+$')
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON viralize_audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON viralize_audit_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON viralize_audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON viralize_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON viralize_audit_logs(created_at DESC);

-- ============================================================================
-- ENABLE RLS ON AUDIT LOGS
-- ============================================================================

ALTER TABLE viralize_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON viralize_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON viralize_audit_logs FOR INSERT
  WITH CHECK (true);

-- Prevent modification/deletion of audit logs
CREATE POLICY "Prevent audit log modification"
  ON viralize_audit_logs FOR UPDATE
  USING (false);

CREATE POLICY "Prevent audit log deletion"
  ON viralize_audit_logs FOR DELETE
  USING (false);

-- ============================================================================
-- HELPER FUNCTION: Log Audit Events
-- ============================================================================

CREATE OR REPLACE FUNCTION log_audit_event(
  p_action text,
  p_resource_type text,
  p_resource_id text,
  p_user_id uuid DEFAULT NULL,
  p_admin_id uuid DEFAULT auth.uid(),
  p_old_value jsonb DEFAULT NULL,
  p_new_value jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO viralize_audit_logs (
    action,
    resource_type,
    resource_id,
    user_id,
    admin_id,
    old_value,
    new_value,
    ip_address,
    user_agent
  ) VALUES (
    p_action,
    p_resource_type,
    p_resource_id,
    p_user_id,
    p_admin_id,
    p_old_value,
    p_new_value,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ============================================================================
-- SECURE ADMIN FUNCTIONS (with audit logging)
-- ============================================================================

-- Update user plan with audit trail
CREATE OR REPLACE FUNCTION update_user_plan_secure(
  p_target_user_id uuid,
  p_new_plan text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_plan text;
  v_executor_id uuid;
BEGIN
  -- Get executor (caller)
  v_executor_id := auth.uid();

  -- Verify executor is admin
  IF NOT EXISTS (
    SELECT 1 FROM viralize_users
    WHERE id = v_executor_id AND is_admin = true
  ) THEN
    RETURN json_build_object('error', 'Unauthorized', 'code', 'ADMIN_REQUIRED');
  END IF;

  -- Validate plan value
  IF p_new_plan NOT IN ('free', 'pro', 'studio', 'business', 'unlimited') THEN
    RETURN json_build_object('error', 'Invalid plan', 'code', 'INVALID_PLAN');
  END IF;

  -- Get current plan for audit
  SELECT plan INTO v_old_plan FROM viralize_users WHERE id = p_target_user_id;

  IF v_old_plan IS NULL THEN
    RETURN json_build_object('error', 'User not found', 'code', 'USER_NOT_FOUND');
  END IF;

  -- Update user plan
  UPDATE viralize_users
  SET plan = p_new_plan, updated_at = now()
  WHERE id = p_target_user_id;

  -- Log the action
  PERFORM log_audit_event(
    p_action => 'plan_updated',
    p_resource_type => 'user',
    p_resource_id => p_target_user_id::text,
    p_user_id => p_target_user_id,
    p_admin_id => v_executor_id,
    p_old_value => jsonb_build_object('plan', v_old_plan),
    p_new_value => jsonb_build_object('plan', p_new_plan)
  );

  RETURN json_build_object('success', true, 'message', 'Plan updated');
END;
$$;

-- Add credits with audit trail
CREATE OR REPLACE FUNCTION add_user_credits_secure(
  p_target_user_id uuid,
  p_amount integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_credits integer;
  v_new_credits integer;
  v_executor_id uuid;
BEGIN
  -- Get executor (caller)
  v_executor_id := auth.uid();

  -- Verify executor is admin
  IF NOT EXISTS (
    SELECT 1 FROM viralize_users
    WHERE id = v_executor_id AND is_admin = true
  ) THEN
    RETURN json_build_object('error', 'Unauthorized', 'code', 'ADMIN_REQUIRED');
  END IF;

  -- Validate amount
  IF p_amount < 0 OR p_amount > 1000000 THEN
    RETURN json_build_object('error', 'Invalid amount', 'code', 'INVALID_AMOUNT');
  END IF;

  -- Get current credits for audit
  SELECT credits INTO v_old_credits FROM viralize_users WHERE id = p_target_user_id;

  IF v_old_credits IS NULL THEN
    RETURN json_build_object('error', 'User not found', 'code', 'USER_NOT_FOUND');
  END IF;

  -- Calculate new balance
  v_new_credits := v_old_credits + p_amount;

  -- Update credits
  UPDATE viralize_users
  SET credits = v_new_credits, updated_at = now()
  WHERE id = p_target_user_id;

  -- Log the action
  PERFORM log_audit_event(
    p_action => 'credits_added',
    p_resource_type => 'credits',
    p_resource_id => p_target_user_id::text,
    p_user_id => p_target_user_id,
    p_admin_id => v_executor_id,
    p_old_value => jsonb_build_object('credits', v_old_credits),
    p_new_value => jsonb_build_object('credits', v_new_credits, 'amount_added', p_amount)
  );

  RETURN json_build_object(
    'success', true,
    'message', format('Added %s credits', p_amount),
    'new_balance', v_new_credits
  );
END;
$$;

-- Delete user with audit trail
CREATE OR REPLACE FUNCTION delete_user_secure(
  p_target_user_id uuid,
  p_reason text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_executor_id uuid;
BEGIN
  -- Get executor (caller)
  v_executor_id := auth.uid();

  -- Verify executor is admin
  IF NOT EXISTS (
    SELECT 1 FROM viralize_users
    WHERE id = v_executor_id AND is_admin = true
  ) THEN
    RETURN json_build_object('error', 'Unauthorized', 'code', 'ADMIN_REQUIRED');
  END IF;

  -- Validate reason
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RETURN json_build_object('error', 'Deletion reason required', 'code', 'REASON_REQUIRED');
  END IF;

  -- Get user info for audit
  SELECT email INTO v_user_email FROM viralize_users WHERE id = p_target_user_id;

  IF v_user_email IS NULL THEN
    RETURN json_build_object('error', 'User not found', 'code', 'USER_NOT_FOUND');
  END IF;

  -- Log the action BEFORE deletion
  PERFORM log_audit_event(
    p_action => 'user_deleted',
    p_resource_type => 'user',
    p_resource_id => p_target_user_id::text,
    p_user_id => p_target_user_id,
    p_admin_id => v_executor_id,
    p_old_value => jsonb_build_object('email', v_user_email),
    p_new_value => jsonb_build_object('reason', p_reason)
  );

  -- Delete the user
  DELETE FROM viralize_users WHERE id = p_target_user_id;

  RETURN json_build_object('success', true, 'message', 'User deleted');
END;
$$;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Update a user's plan:
-- SELECT update_user_plan_secure('uuid-here', 'pro');

-- Add credits to a user:
-- SELECT add_user_credits_secure('uuid-here', 100);

-- Delete a user with reason:
-- SELECT delete_user_secure('uuid-here', 'User requested deletion');

-- View audit logs (admin only):
-- SELECT * FROM viralize_audit_logs ORDER BY created_at DESC LIMIT 100;
