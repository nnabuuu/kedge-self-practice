-- Remove index
DROP INDEX IF EXISTS kedge_practice.idx_quizzes_extra_properties;

-- Remove extra_properties column from quizzes table
ALTER TABLE kedge_practice.quizzes
DROP COLUMN IF EXISTS extra_properties;
