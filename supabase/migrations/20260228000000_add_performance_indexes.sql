-- Add composite indexes for common query patterns to reduce Disk IO

-- Composite index for backtests queries (user_id + account_id + folder_id + sort_order)
CREATE INDEX IF NOT EXISTS idx_backtests_user_account_folder ON public.backtests(user_id, account_id, folder_id, sort_order);

-- Composite index for playbook_setups queries
CREATE INDEX IF NOT EXISTS idx_playbook_setups_user_account_folder ON public.playbook_setups(user_id, account_id, folder_id, sort_order);

-- Composite index for folders queries
CREATE INDEX IF NOT EXISTS idx_folders_user_account ON public.folders(user_id, account_id);

-- Composite index for AI conversations
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_updated ON public.ai_conversations(user_id, updated_at DESC);

-- Composite index for AI messages
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_created ON public.ai_messages(conversation_id, created_at);

-- Index for morning_forecasts date lookups
CREATE INDEX IF NOT EXISTS idx_morning_forecasts_user_date ON public.morning_forecasts(user_id, date DESC);

-- Index for profiles selected account lookups
CREATE INDEX IF NOT EXISTS idx_profiles_selected_account ON public.profiles(selected_account_id);

-- Analyze tables to update statistics for query planner
ANALYZE public.trades;
ANALYZE public.backtests;
ANALYZE public.playbook_setups;
ANALYZE public.folders;
ANALYZE public.ai_conversations;
ANALYZE public.ai_messages;
ANALYZE public.morning_forecasts;
ANALYZE public.profiles;
