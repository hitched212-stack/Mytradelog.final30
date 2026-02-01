-- Add index on profiles for faster user lookup
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Analyze tables to update query planner statistics
ANALYZE public.trades;
ANALYZE public.profiles;
ANALYZE public.accounts;
ANALYZE public.account_users;