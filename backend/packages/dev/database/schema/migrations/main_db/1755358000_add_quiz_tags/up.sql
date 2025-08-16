-- Add tags column to quizzes table for storing keywords/tags
ALTER TABLE kedge_practice.quizzes
ADD COLUMN tags JSONB NOT NULL DEFAULT '[]';

-- Create index on tags for better search performance
CREATE INDEX IF NOT EXISTS idx_quizzes_tags ON kedge_practice.quizzes USING GIN (tags);