-- Add chart_analysis_notes column to trades table for storing chart analysis notes
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS chart_analysis_notes text DEFAULT '';