-- Add amount column to subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN amount BIGINT DEFAULT 0;

-- Add current_period_start if it doesn't exist
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
