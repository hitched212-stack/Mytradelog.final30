-- Add news-related fields to trades table
ALTER TABLE public.trades
ADD COLUMN has_news boolean DEFAULT false,
ADD COLUMN news_type text DEFAULT NULL,
ADD COLUMN news_impact text DEFAULT NULL,
ADD COLUMN news_time time without time zone DEFAULT NULL;