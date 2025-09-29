-- Drop the index
DROP INDEX IF EXISTS kedge_practice.idx_quizzes_answer_index;

-- Remove the answer_index column
ALTER TABLE kedge_practice.quizzes
DROP COLUMN IF EXISTS answer_index;