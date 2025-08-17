-- Rename student_id to user_id in student_weaknesses table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kedge_practice' 
        AND table_name = 'student_weaknesses' 
        AND column_name = 'student_id'
    ) THEN
        ALTER TABLE kedge_practice.student_weaknesses 
        RENAME COLUMN student_id TO user_id;
        
        -- Update indexes
        ALTER INDEX IF EXISTS idx_student_weaknesses_student_id 
        RENAME TO idx_student_weaknesses_user_id;
        
        ALTER INDEX IF EXISTS idx_student_weaknesses_student_knowledge 
        RENAME TO idx_student_weaknesses_user_knowledge;
    END IF;
END $$;

-- Rename student_id to user_id in student_mistakes table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kedge_practice' 
        AND table_name = 'student_mistakes' 
        AND column_name = 'student_id'
    ) THEN
        ALTER TABLE kedge_practice.student_mistakes 
        RENAME COLUMN student_id TO user_id;
        
        -- Update indexes
        ALTER INDEX IF EXISTS idx_student_mistakes_student_id 
        RENAME TO idx_student_mistakes_user_id;
        
        ALTER INDEX IF EXISTS idx_student_mistakes_student_quiz 
        RENAME TO idx_student_mistakes_user_quiz;
    END IF;
END $$;

-- Update comments
COMMENT ON COLUMN kedge_practice.student_weaknesses.user_id IS 'User ID (can be student, teacher, or any user type)';
COMMENT ON COLUMN kedge_practice.student_mistakes.user_id IS 'User ID (can be student, teacher, or any user type)';