-- Add wins and losses columns to backtests table
ALTER TABLE public.backtests 
ADD COLUMN wins integer NOT NULL DEFAULT 0,
ADD COLUMN losses integer NOT NULL DEFAULT 0;

-- Add wins and losses columns to playbook_setups table
ALTER TABLE public.playbook_setups 
ADD COLUMN wins integer NOT NULL DEFAULT 0,
ADD COLUMN losses integer NOT NULL DEFAULT 0;