-- Add lyrics column to viralize_remixes
ALTER TABLE viralize_remixes
  ADD COLUMN IF NOT EXISTS lyrics TEXT,
  ADD COLUMN IF NOT EXISTS style_tags TEXT,
  ADD COLUMN IF NOT EXISTS original_title TEXT;

-- Allow updates (for publish etc)
CREATE POLICY IF NOT EXISTS "Users can update own remixes"
  ON viralize_remixes FOR UPDATE
  USING (auth.uid() = user_id);
