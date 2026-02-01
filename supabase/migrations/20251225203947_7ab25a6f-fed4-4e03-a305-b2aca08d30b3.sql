-- Add emotional_state column to trades table (1-5 rating scale)
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS emotional_state integer DEFAULT 3 CHECK (emotional_state >= 1 AND emotional_state <= 5);