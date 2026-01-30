-- Create account type enum
CREATE TYPE public.account_type AS ENUM ('prop_firm', 'personal', 'funded', 'demo');

-- Create account status enum
CREATE TYPE public.account_status AS ENUM ('active', 'archived');

-- Add new columns to accounts table
ALTER TABLE public.accounts
ADD COLUMN type public.account_type DEFAULT 'personal',
ADD COLUMN broker_name text,
ADD COLUMN currency text DEFAULT 'USD',
ADD COLUMN starting_balance numeric DEFAULT 0,
ADD COLUMN status public.account_status DEFAULT 'active';

-- Add index for faster queries on active accounts
CREATE INDEX idx_accounts_status ON public.accounts(status);