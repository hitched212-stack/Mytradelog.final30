-- Add trading_rules and selected_timeframes columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trading_rules jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS selected_timeframes jsonb DEFAULT '["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]'::jsonb;