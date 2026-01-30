-- Add separate columns for pre-market and post-market chart data
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS pre_market_images text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS post_market_images text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pre_market_notes text DEFAULT '',
ADD COLUMN IF NOT EXISTS post_market_notes text DEFAULT '';