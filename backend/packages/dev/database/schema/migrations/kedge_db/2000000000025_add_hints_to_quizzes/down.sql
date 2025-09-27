-- Rollback: Remove hints column and related index

-- Drop the index first
DROP INDEX IF EXISTS kedge_practice.idx_quizzes_hints;

-- Drop the hints column
ALTER TABLE kedge_practice.quizzes 
DROP COLUMN IF EXISTS hints;