-- Consolidate emotional journal fields into overall_emotions
-- This migration combines emotionalJournalBefore, emotionalJournalDuring, and emotionalJournalAfter
-- into the overallEmotions field for all existing trades to preserve user data

BEGIN;

-- Update trades that have any emotional journal data
UPDATE trades
SET overall_emotions = CASE
  -- If overall_emotions already has content, append the other fields
  WHEN overall_emotions IS NOT NULL AND overall_emotions != '' THEN
    overall_emotions || COALESCE(
      (CASE WHEN emotional_journal_before IS NOT NULL AND emotional_journal_before != '' 
        THEN E'\n\nBefore: ' || emotional_journal_before ELSE '' END) ||
      (CASE WHEN emotional_journal_during IS NOT NULL AND emotional_journal_during != '' 
        THEN E'\n\nDuring: ' || emotional_journal_during ELSE '' END) ||
      (CASE WHEN emotional_journal_after IS NOT NULL AND emotional_journal_after != '' 
        THEN E'\n\nAfter: ' || emotional_journal_after ELSE '' END),
      ''
    )
  -- If overall_emotions is empty, combine all three fields with labels
  ELSE TRIM(
    COALESCE(
      (CASE WHEN emotional_journal_before IS NOT NULL AND emotional_journal_before != '' 
        THEN 'Before: ' || emotional_journal_before ELSE '' END) ||
      (CASE WHEN emotional_journal_during IS NOT NULL AND emotional_journal_during != '' 
        THEN E'\n\nDuring: ' || emotional_journal_during ELSE '' END) ||
      (CASE WHEN emotional_journal_after IS NOT NULL AND emotional_journal_after != '' 
        THEN E'\n\nAfter: ' || emotional_journal_after ELSE '' END),
      ''
    )
  )
END
WHERE 
  (emotional_journal_before IS NOT NULL AND emotional_journal_before != '') OR
  (emotional_journal_during IS NOT NULL AND emotional_journal_during != '') OR
  (emotional_journal_after IS NOT NULL AND emotional_journal_after != '');

-- No need to drop columns yet - they can stay for backwards compatibility
-- If you want to drop them later, uncomment the lines below:
-- ALTER TABLE trades DROP COLUMN IF EXISTS emotional_journal_before;
-- ALTER TABLE trades DROP COLUMN IF EXISTS emotional_journal_during;
-- ALTER TABLE trades DROP COLUMN IF EXISTS emotional_journal_after;

COMMIT;
