-- Add knowledge_point_id column to quizzes table
ALTER TABLE kedge_practice.quizzes
ADD COLUMN knowledge_point_id TEXT;

-- Create index on knowledge_point_id for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_knowledge_point_id ON kedge_practice.quizzes(knowledge_point_id);

-- Add foreign key constraint to ensure referential integrity
-- Note: Using TEXT instead of UUID since knowledge points use string IDs like "kp_1"
-- ALTER TABLE kedge_practice.quizzes
-- ADD CONSTRAINT fk_quizzes_knowledge_point
-- FOREIGN KEY (knowledge_point_id) REFERENCES kedge_practice.knowledge_points(id);