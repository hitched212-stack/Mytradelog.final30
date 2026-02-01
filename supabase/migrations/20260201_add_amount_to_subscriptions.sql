-- Add amount column to subscriptions table to store actual price from Stripe
ALTER TABLE public.subscriptions
ADD COLUMN amount INTEGER; -- Amount in cents, e.g., 999 for $9.99

-- Add comment for clarity
COMMENT ON COLUMN public.subscriptions.amount IS 'Amount in cents charged per billing period from Stripe';
