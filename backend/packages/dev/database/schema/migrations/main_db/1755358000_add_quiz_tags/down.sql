-- Remove tags column and index
DROP INDEX IF EXISTS kedge_practice.idx_quizzes_tags;
ALTER TABLE kedge_practice.quizzes DROP COLUMN IF EXISTS tags;