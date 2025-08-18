-- Restore difficulty columns (rollback)
ALTER TABLE kedge_practice.practice_sessions 
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium';

ALTER TABLE kedge_practice.quizzes 
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium';