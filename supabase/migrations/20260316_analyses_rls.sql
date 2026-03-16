-- Ensure RLS is enabled and policies exist for viralize_analyses
ALTER TABLE viralize_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own analyses"
  ON viralize_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own analyses"
  ON viralize_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own analyses"
  ON viralize_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Ensure RLS is enabled for viralize_remixes too
ALTER TABLE viralize_remixes ENABLE ROW LEVEL SECURITY;
