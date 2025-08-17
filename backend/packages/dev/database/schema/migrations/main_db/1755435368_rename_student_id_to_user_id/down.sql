-- Revert column rename if needed (handles both cases)
DO $$ 
BEGIN
    -- Check if user_id column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kedge_practice' 
        AND table_name = 'practice_sessions' 
        AND column_name = 'user_id'
    ) THEN
        -- Rename user_id back to student_id
        ALTER TABLE kedge_practice.practice_sessions 
        RENAME COLUMN user_id TO student_id;
        
        -- Drop new constraint if exists
        ALTER TABLE kedge_practice.practice_sessions
        DROP CONSTRAINT IF EXISTS practice_sessions_user_id_fkey;
    END IF;
    
    -- Restore original constraint (idempotent)
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'kedge_practice'
        AND table_name = 'practice_sessions'
        AND constraint_name = 'practice_sessions_student_id_fkey'
    ) THEN
        ALTER TABLE kedge_practice.practice_sessions
        ADD CONSTRAINT practice_sessions_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES kedge_practice.users(id);
    END IF;
END $$;

-- Remove comment
COMMENT ON COLUMN kedge_practice.practice_sessions.student_id IS NULL;