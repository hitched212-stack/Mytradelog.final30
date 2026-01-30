-- Add account_id column to trades table
ALTER TABLE public.trades 
ADD COLUMN account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_trades_account_id ON public.trades(account_id);

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can insert their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can delete their own trades" ON public.trades;

-- Create new RLS policies that scope trades to accounts user belongs to
CREATE POLICY "Users can view trades for their accounts" 
ON public.trades 
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND (account_id IS NULL OR is_account_member(auth.uid(), account_id))
);

CREATE POLICY "Users can insert trades for their accounts" 
ON public.trades 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (account_id IS NULL OR is_account_member(auth.uid(), account_id))
);

CREATE POLICY "Users can update trades for their accounts" 
ON public.trades 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND (account_id IS NULL OR is_account_member(auth.uid(), account_id))
);

CREATE POLICY "Users can delete trades for their accounts" 
ON public.trades 
FOR DELETE 
USING (
  auth.uid() = user_id 
  AND (account_id IS NULL OR is_account_member(auth.uid(), account_id))
);