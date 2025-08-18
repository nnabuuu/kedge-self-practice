-- Remove difficulty columns from all tables
ALTER TABLE kedge_practice.practice_sessions 
DROP COLUMN IF EXISTS difficulty;

ALTER TABLE kedge_practice.quizzes 
DROP COLUMN IF EXISTS difficulty;