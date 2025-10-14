-- =================================================================
-- Rollback session resume fields migration
-- =================================================================
-- This migration removes the fields added for session resume functionality
--
-- Related: NIE-26
-- =================================================================

-- Drop the composite index
DROP INDEX IF EXISTS kedge_practice.idx_practice_sessions_user_status_updated;

-- Drop the columns
ALTER TABLE kedge_practice.practice_sessions
DROP COLUMN IF EXISTS last_question_index,
DROP COLUMN IF EXISTS session_state;
