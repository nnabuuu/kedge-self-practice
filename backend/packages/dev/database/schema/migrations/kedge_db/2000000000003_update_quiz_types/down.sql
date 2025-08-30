-- Revert quiz type check constraint to original
ALTER TABLE kedge_practice.quizzes 
DROP CONSTRAINT IF EXISTS quizzes_type_check;

ALTER TABLE kedge_practice.quizzes 
ADD CONSTRAINT quizzes_type_check 
CHECK (type IN ('single-choice', 'multiple-choice', 'essay'));

-- Drop indexes
DROP INDEX IF EXISTS kedge_practice.idx_quizzes_type;
DROP INDEX IF EXISTS kedge_practice.idx_quizzes_knowledge_point_id;