
ALTER TABLE public.viralize_users ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.viralize_users ADD COLUMN IF NOT EXISTS remixes_used integer DEFAULT 0;
ALTER TABLE public.viralize_users ADD COLUMN IF NOT EXISTS api_key text;
