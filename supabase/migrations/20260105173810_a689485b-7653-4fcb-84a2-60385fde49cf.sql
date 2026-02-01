-- Add new fields to playbook_setups table for enhanced trading context
ALTER TABLE public.playbook_setups 
ADD COLUMN IF NOT EXISTS session text,
ADD COLUMN IF NOT EXISTS day_of_week text,
ADD COLUMN IF NOT EXISTS date date,
ADD COLUMN IF NOT EXISTS has_news boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS news_impact text,
ADD COLUMN IF NOT EXISTS notes text;