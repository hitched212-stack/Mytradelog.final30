-- Add category column to trades table
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'stocks';

-- Add a comment for clarity
COMMENT ON COLUMN public.trades.category IS 'Trade category: stocks, futures, forex, crypto, options';