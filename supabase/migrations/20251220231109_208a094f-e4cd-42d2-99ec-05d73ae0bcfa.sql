-- Create morning_forecasts table
CREATE TABLE public.morning_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  images TEXT[] DEFAULT '{}',
  forecast TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.morning_forecasts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own forecasts" 
ON public.morning_forecasts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own forecasts" 
ON public.morning_forecasts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forecasts" 
ON public.morning_forecasts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forecasts" 
ON public.morning_forecasts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_morning_forecasts_updated_at
BEFORE UPDATE ON public.morning_forecasts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint for one forecast per day per user
ALTER TABLE public.morning_forecasts ADD CONSTRAINT unique_user_date UNIQUE (user_id, date);