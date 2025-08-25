-- Update quiz type check constraint to include all supported types
ALTER TABLE kedge_practice.quizzes 
DROP CONSTRAINT IF EXISTS quizzes_type_check;

ALTER TABLE kedge_practice.quizzes 
ADD CONSTRAINT quizzes_type_check 
CHECK (type IN ('single-choice', 'multiple-choice', 'fill-in-the-blank', 'subjective', 'other', 'essay'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_quizzes_type ON kedge_practice.quizzes(type);
CREATE INDEX IF NOT EXISTS idx_quizzes_knowledge_point_id ON kedge_practice.quizzes(knowledge_point_id);