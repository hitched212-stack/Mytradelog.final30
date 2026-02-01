-- Add news_filters column to profiles table to sync filters across devices
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS news_filters jsonb DEFAULT '{"currency": "all", "impact": "all"}'::jsonb;