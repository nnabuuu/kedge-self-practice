-- Add unique constraint for practice_answers (session_id, quiz_id)
-- This ensures ON CONFLICT clause works properly when updating answers
ALTER TABLE kedge_practice.practice_answers 
ADD CONSTRAINT unique_session_quiz UNIQUE (session_id, quiz_id);