-- Add news_events column to trades table for storing multiple news events
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS news_events JSONB DEFAULT '[]'::jsonb;