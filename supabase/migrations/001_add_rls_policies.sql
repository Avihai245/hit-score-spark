-- Security Migration: Enable Row-Level Security (RLS) on all tables
-- This ensures users can only access their own data

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE IF EXISTS viralize_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS viralize_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS viralize_remixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS viralize_credits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
  ON viralize_users FOR SELECT
  USING (auth.uid() = id);

-- Users cannot directly update their profiles (use functions instead)
CREATE POLICY "Users cannot update own profile"
  ON viralize_users FOR UPDATE
  USING (false);

-- Admins can view all users via verified check
CREATE POLICY "Admins can view all users"
  ON viralize_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- System can insert new users (auth triggered)
CREATE POLICY "System can insert users"
  ON viralize_users FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- ANALYSES TABLE POLICIES
-- ============================================================================

-- Users can view their own analyses
CREATE POLICY "Users can view own analyses"
  ON viralize_analyses FOR SELECT
  USING (user_id = auth.uid());

-- Users can create analyses
CREATE POLICY "Users can create analyses"
  ON viralize_analyses FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own analyses
CREATE POLICY "Users can update own analyses"
  ON viralize_analyses FOR UPDATE
  USING (user_id = auth.uid());

-- Users cannot delete (soft delete only, managed via function)
CREATE POLICY "Users cannot delete analyses"
  ON viralize_analyses FOR DELETE
  USING (false);

-- Admins can view all analyses
CREATE POLICY "Admins can view all analyses"
  ON viralize_analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- REMIXES TABLE POLICIES
-- ============================================================================

-- Users can view their own remixes
CREATE POLICY "Users can view own remixes"
  ON viralize_remixes FOR SELECT
  USING (user_id = auth.uid());

-- Users can create remixes
CREATE POLICY "Users can create remixes"
  ON viralize_remixes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own remixes
CREATE POLICY "Users can update own remixes"
  ON viralize_remixes FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can view all remixes
CREATE POLICY "Admins can view all remixes"
  ON viralize_remixes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- CREDITS TABLE POLICIES
-- ============================================================================

-- Users can view their own credit transactions
CREATE POLICY "Users can view own credits"
  ON viralize_credits FOR SELECT
  USING (user_id = auth.uid());

-- System can insert credits transactions
CREATE POLICY "System can insert credits"
  ON viralize_credits FOR INSERT
  WITH CHECK (true);

-- Admins can view all credit transactions
CREATE POLICY "Admins can view all credits"
  ON viralize_credits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can insert credits
CREATE POLICY "Admins can insert credits"
  ON viralize_credits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- HELPFUL COMMENT FOR ADMINS
-- ============================================================================

-- NOTE: RLS policies are now active. Use these patterns to access data:
--
-- 1. For users: SELECT * FROM viralize_users WHERE id = auth.uid()
--    Only sees own data
--
-- 2. For admins: SELECT * FROM viralize_users
--    Can see all data if is_admin = true
--
-- 3. For system functions: Use service_role key (server-side only)
--    Never expose service_role key to client
--
-- 4. For updates/deletes: Use edge functions with proper validation
--    Never allow direct updates/deletes from client
