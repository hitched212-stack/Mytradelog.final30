-- Add new fields to trades table
ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS followed_rules boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notes text DEFAULT '';

-- Update existing rows to have default values
UPDATE public.trades SET followed_rules = true WHERE followed_rules IS NULL;
UPDATE public.trades SET notes = '' WHERE notes IS NULL;