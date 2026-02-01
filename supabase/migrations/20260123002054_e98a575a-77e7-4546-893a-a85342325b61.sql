-- Add indexes to trades table for faster queries
-- These indexes will dramatically speed up the most common query patterns

-- Index for filtering by user_id (most common filter)
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);

-- Index for filtering by account_id (used with user_id)
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON public.trades(account_id);

-- Composite index for the most common query pattern: user_id + account_id + date ordering
CREATE INDEX IF NOT EXISTS idx_trades_user_account_date ON public.trades(user_id, account_id, date DESC);

-- Index on date for date-based filtering and sorting
CREATE INDEX IF NOT EXISTS idx_trades_date ON public.trades(date DESC);

-- Composite index for status filtering (new feature)
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);

-- Add index on account_users for faster account lookup
CREATE INDEX IF NOT EXISTS idx_account_users_user_id ON public.account_users(user_id);
CREATE INDEX IF NOT EXISTS idx_account_users_account_id ON public.account_users(account_id);