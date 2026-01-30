-- Add no_trade_taken column to trades table
ALTER TABLE public.trades ADD COLUMN no_trade_taken boolean DEFAULT false;