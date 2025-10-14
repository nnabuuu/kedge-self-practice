-- =================================================================
-- Add session resume fields for "Continue Last Practice" feature
-- =================================================================
-- This migration adds fields to practice_sessions table to support
-- resuming incomplete practice sessions.
--
-- Related: NIE-26
-- =================================================================

-- Add columns to track session progress and state
ALTER TABLE kedge_practice.practice_sessions
ADD COLUMN IF NOT EXISTS last_question_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_state JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN kedge_practice.practice_sessions.last_question_index IS
'Index of the question the user was viewing/working on when they last interacted with this session. Used for resuming at the correct position.';

COMMENT ON COLUMN kedge_practice.practice_sessions.session_state IS
'Arbitrary UI state data (e.g., shuffle seed, timer state) stored as JSON. Used to restore the exact session state when resuming.';

-- Create composite index for fast incomplete session queries
-- This index will be used when checking for incomplete sessions by user
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_status_updated
ON kedge_practice.practice_sessions(user_id, status, updated_at DESC)
WHERE status IN ('pending', 'in_progress');

-- Add comment for the index
COMMENT ON INDEX kedge_practice.idx_practice_sessions_user_status_updated IS
'Optimizes queries for finding incomplete practice sessions by user. Filtered index includes only active sessions (pending/in_progress) for better performance.';

-- Update existing in_progress sessions to have last_question_index = 0
-- This ensures existing sessions have a valid starting point if resumed
UPDATE kedge_practice.practice_sessions
SET last_question_index = 0
WHERE last_question_index IS NULL AND status = 'in_progress';
