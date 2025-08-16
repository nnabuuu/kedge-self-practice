-- Remove knowledge_point_id column from quizzes table
ALTER TABLE kedge_practice.quizzes
DROP COLUMN IF EXISTS knowledge_point_id;

-- Drop index
DROP INDEX IF EXISTS idx_quizzes_knowledge_point_id;