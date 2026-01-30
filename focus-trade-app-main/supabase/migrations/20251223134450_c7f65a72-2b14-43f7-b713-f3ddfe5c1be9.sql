-- Add new columns to morning_forecasts for enhanced functionality
ALTER TABLE public.morning_forecasts 
ADD COLUMN IF NOT EXISTS symbol TEXT,
ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'bullish',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS outcome TEXT;

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_morning_forecasts_status ON public.morning_forecasts(status);
CREATE INDEX IF NOT EXISTS idx_morning_forecasts_user_status ON public.morning_forecasts(user_id, status);