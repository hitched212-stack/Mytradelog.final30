-- Add status column to trades table for tracking open/closed trades
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'closed' CHECK (status IN ('open', 'closed'));