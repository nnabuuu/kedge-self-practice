-- Remove auto_advance_delay column from practice_sessions table
ALTER TABLE kedge_practice.practice_sessions
DROP COLUMN IF EXISTS auto_advance_delay;