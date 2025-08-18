-- Check if column needs to be renamed (handles both cases)
DO $$ 
BEGIN
    -- Check if student_id column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kedge_practice' 
        AND table_name = 'practice_sessions' 
        AND column_name = 'student_id'
    ) THEN
        -- Rename student_id to user_id
        ALTER TABLE kedge_practice.practice_sessions 
        RENAME COLUMN student_id TO user_id;
        
        -- Drop old constraint if exists
        ALTER TABLE kedge_practice.practice_sessions
        DROP CONSTRAINT IF EXISTS practice_sessions_student_id_fkey;
    END IF;
    
    -- Always ensure the new constraint exists (idempotent)
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'kedge_practice'
        AND table_name = 'practice_sessions'
        AND constraint_name = 'practice_sessions_user_id_fkey'
    ) THEN
        ALTER TABLE kedge_practice.practice_sessions
        ADD CONSTRAINT practice_sessions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES kedge_practice.users(id);
    END IF;
END $$;

-- Add/update comment (idempotent)
COMMENT ON COLUMN kedge_practice.practice_sessions.user_id IS 'User ID (can be student, teacher, or any user type)';