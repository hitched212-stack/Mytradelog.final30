-- Add entry_time column to playbook_setups table
ALTER TABLE public.playbook_setups 
ADD COLUMN IF NOT EXISTS entry_time TEXT;

-- Add entry_time column to backtests table  
ALTER TABLE public.backtests 
ADD COLUMN IF NOT EXISTS entry_time TEXT;