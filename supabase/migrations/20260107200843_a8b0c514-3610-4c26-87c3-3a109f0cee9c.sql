-- Add followed_rules column to trades table for storing which rules were followed
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS followed_rules_list text[] DEFAULT NULL;