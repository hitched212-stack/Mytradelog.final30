-- Add forecast_type column to distinguish pre-market and post-market forecasts
ALTER TABLE public.morning_forecasts 
ADD COLUMN IF NOT EXISTS forecast_type text DEFAULT 'pre_market';

-- Add forecast_id to trades table to link trades to forecasts
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS forecast_id uuid REFERENCES public.morning_forecasts(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trades_forecast_id ON public.trades(forecast_id);
CREATE INDEX IF NOT EXISTS idx_morning_forecasts_type ON public.morning_forecasts(forecast_type);