-- Remove unique constraint
ALTER TABLE kedge_practice.practice_answers 
DROP CONSTRAINT IF EXISTS unique_session_quiz;