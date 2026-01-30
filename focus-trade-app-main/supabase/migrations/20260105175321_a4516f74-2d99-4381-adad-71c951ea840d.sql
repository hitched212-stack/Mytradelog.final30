-- Add symbol column to playbook_setups table for trading pair selection
ALTER TABLE public.playbook_setups 
ADD COLUMN IF NOT EXISTS symbol text;