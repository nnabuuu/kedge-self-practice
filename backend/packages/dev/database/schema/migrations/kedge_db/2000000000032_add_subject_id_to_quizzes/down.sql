-- Drop the index on subject_id
DROP INDEX IF EXISTS kedge_practice.idx_quizzes_subject_id;

-- Remove the subject_id column from quizzes table
ALTER TABLE kedge_practice.quizzes
DROP COLUMN IF EXISTS subject_id;
