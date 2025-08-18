-- Add unique constraint for practice_answers (session_id, quiz_id) if it doesn't exist
-- This ensures ON CONFLICT clause works properly when updating answers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_session_quiz' 
        AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'kedge_practice')
    ) THEN
        ALTER TABLE kedge_practice.practice_answers 
        ADD CONSTRAINT unique_session_quiz UNIQUE (session_id, quiz_id);
    END IF;
END $$;