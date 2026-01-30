-- Add news_events JSON column to playbook_setups table
ALTER TABLE public.playbook_setups ADD COLUMN IF NOT EXISTS news_events jsonb DEFAULT NULL;

-- Add news_events JSON column to backtests table
ALTER TABLE public.backtests ADD COLUMN IF NOT EXISTS news_events jsonb DEFAULT NULL;