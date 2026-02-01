-- Add sort_order column to playbook_setups for card reordering
ALTER TABLE public.playbook_setups 
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Add sort_order column to backtests for card reordering
ALTER TABLE public.backtests 
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Add symbol column to backtests to match playbook
ALTER TABLE public.backtests 
ADD COLUMN IF NOT EXISTS session text,
ADD COLUMN IF NOT EXISTS day_of_week text,
ADD COLUMN IF NOT EXISTS date date,
ADD COLUMN IF NOT EXISTS has_news boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS news_impact text;