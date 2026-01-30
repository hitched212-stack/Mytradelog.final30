-- Add is_paper_trade column to trades table
ALTER TABLE public.trades 
ADD COLUMN is_paper_trade boolean DEFAULT false;