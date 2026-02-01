-- Add overall_emotions field to trades table
ALTER TABLE public.trades 
ADD COLUMN overall_emotions TEXT;