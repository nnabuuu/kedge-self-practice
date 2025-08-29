-- Drop the index
DROP INDEX IF EXISTS kedge_practice.idx_practice_sessions_subject_id;

-- Remove the subject_id column
ALTER TABLE kedge_practice.practice_sessions
DROP COLUMN IF EXISTS subject_id;