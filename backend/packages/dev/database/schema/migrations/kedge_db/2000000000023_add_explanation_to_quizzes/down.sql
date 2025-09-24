-- Remove explanation column and related index
DROP INDEX IF EXISTS kedge_practice.idx_quizzes_has_explanation;
ALTER TABLE kedge_practice.quizzes 
DROP COLUMN IF EXISTS explanation;