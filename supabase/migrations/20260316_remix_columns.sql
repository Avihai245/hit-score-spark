-- Add missing columns to viralize_remixes table
-- Run this in the Supabase SQL editor if columns don't already exist

ALTER TABLE viralize_remixes
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS genre TEXT,
  ADD COLUMN IF NOT EXISTS suno_task_id TEXT,
  ADD COLUMN IF NOT EXISTS analysis_id UUID REFERENCES viralize_analyses(id) ON DELETE SET NULL;

-- Ensure RLS policies allow users to read their own remixes
CREATE POLICY IF NOT EXISTS "Users can view own remixes"
  ON viralize_remixes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own remixes"
  ON viralize_remixes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own remixes"
  ON viralize_remixes FOR DELETE
  USING (auth.uid() = user_id);
