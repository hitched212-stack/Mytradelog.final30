-- Add column to track if user has completed first sign-in
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS has_logged_in_before BOOLEAN NOT NULL DEFAULT false;