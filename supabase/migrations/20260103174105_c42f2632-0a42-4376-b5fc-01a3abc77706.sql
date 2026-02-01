-- Add selected_account_id to profiles for cross-device persistence
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS selected_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;