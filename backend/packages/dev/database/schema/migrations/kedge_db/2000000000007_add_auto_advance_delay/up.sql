-- Add auto_advance_delay column to practice_sessions table
-- This column stores the delay in seconds before auto-advancing to next question after correct answer
-- Default is 0 (no auto-advance) for backwards compatibility
ALTER TABLE kedge_practice.practice_sessions
ADD COLUMN IF NOT EXISTS auto_advance_delay INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN kedge_practice.practice_sessions.auto_advance_delay IS 'Delay in seconds before auto-advancing to next question after correct answer (0 = disabled)';