-- Add broken_rules column to trades table to store which rules were not followed
ALTER TABLE public.trades 
ADD COLUMN broken_rules text[] DEFAULT NULL;