-- Add stop_loss_pips column to trades table for storing stop loss in pips/points
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS stop_loss_pips numeric DEFAULT NULL;