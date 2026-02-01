-- Drop the unique constraint that prevents multiple forecasts per day
ALTER TABLE public.morning_forecasts DROP CONSTRAINT IF EXISTS unique_user_date;

-- Add a time column to store forecast time
ALTER TABLE public.morning_forecasts ADD COLUMN IF NOT EXISTS forecast_time TIME DEFAULT '09:00:00';