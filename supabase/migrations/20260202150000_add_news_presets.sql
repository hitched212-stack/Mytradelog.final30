-- Add news_presets column to profiles for Economic News presets
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS news_presets JSONB DEFAULT '[]'::jsonb;
