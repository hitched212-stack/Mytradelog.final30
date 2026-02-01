-- Add stripe_customer_id column to profiles table for tracking Stripe customers
ALTER TABLE public.profiles
ADD COLUMN stripe_customer_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
