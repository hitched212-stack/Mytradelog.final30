-- Create folders table for organizing playbook setups and backtests
CREATE TABLE public.folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('playbook', 'backtest')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own folders"
ON public.folders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders"
ON public.folders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
ON public.folders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
ON public.folders FOR DELETE
USING (auth.uid() = user_id);

-- Add folder_id to playbook_setups
ALTER TABLE public.playbook_setups
ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE;

-- Add folder_id to backtests
ALTER TABLE public.backtests
ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE;

-- Create trigger for updated_at
CREATE TRIGGER update_folders_updated_at
BEFORE UPDATE ON public.folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();