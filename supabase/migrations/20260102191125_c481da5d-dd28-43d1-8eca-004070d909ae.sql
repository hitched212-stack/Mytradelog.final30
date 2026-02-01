-- Create backtests table
CREATE TABLE public.backtests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  strategy TEXT,
  symbol TEXT,
  timeframe TEXT,
  win_rate NUMERIC DEFAULT 0,
  profit_factor NUMERIC DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  net_pnl NUMERIC DEFAULT 0,
  notes TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playbook_setups table
CREATE TABLE public.playbook_setups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  win_rate NUMERIC DEFAULT 0,
  risk_reward TEXT,
  timeframe TEXT,
  entry_criteria TEXT,
  exit_criteria TEXT,
  images TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backtests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_setups ENABLE ROW LEVEL SECURITY;

-- RLS policies for backtests
CREATE POLICY "Users can view their own backtests" 
ON public.backtests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backtests" 
ON public.backtests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backtests" 
ON public.backtests FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backtests" 
ON public.backtests FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for playbook_setups
CREATE POLICY "Users can view their own playbook setups" 
ON public.playbook_setups FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own playbook setups" 
ON public.playbook_setups FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playbook setups" 
ON public.playbook_setups FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playbook setups" 
ON public.playbook_setups FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_backtests_updated_at
BEFORE UPDATE ON public.backtests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playbook_setups_updated_at
BEFORE UPDATE ON public.playbook_setups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for backtest and playbook images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('trading-media', 'trading-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can view trading media" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'trading-media');

CREATE POLICY "Users can upload trading media" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'trading-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their trading media" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'trading-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their trading media" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'trading-media' AND auth.uid()::text = (storage.foldername(name))[1]);