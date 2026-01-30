-- Add balance_hidden column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN balance_hidden boolean DEFAULT false;