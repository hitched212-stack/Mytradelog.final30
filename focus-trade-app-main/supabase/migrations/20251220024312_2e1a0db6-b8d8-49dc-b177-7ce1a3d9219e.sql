-- Create trades table for cloud sync
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  date DATE NOT NULL,
  entry_time TEXT NOT NULL,
  holding_time TEXT NOT NULL,
  lot_size NUMERIC NOT NULL,
  performance_grade INTEGER NOT NULL CHECK (performance_grade BETWEEN 1 AND 5),
  entry_price NUMERIC NOT NULL,
  stop_loss NUMERIC NOT NULL,
  take_profit NUMERIC NOT NULL,
  risk_reward_ratio TEXT NOT NULL,
  pnl_amount NUMERIC NOT NULL,
  pnl_percentage NUMERIC NOT NULL,
  pre_market_plan TEXT DEFAULT '',
  post_market_review TEXT DEFAULT '',
  emotional_journal_before TEXT DEFAULT '',
  emotional_journal_during TEXT DEFAULT '',
  emotional_journal_after TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  strategy TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trades
CREATE POLICY "Users can view their own trades"
ON public.trades
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
ON public.trades
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades"
ON public.trades
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades"
ON public.trades
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_trades_updated_at
BEFORE UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_trades_user_id ON public.trades(user_id);
CREATE INDEX idx_trades_date ON public.trades(date);

-- Enable realtime for trades table
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;