-- Revert: Rename user_id back to student_id in student_weaknesses table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kedge_practice' 
        AND table_name = 'student_weaknesses' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE kedge_practice.student_weaknesses 
        RENAME COLUMN user_id TO student_id;
        
        -- Revert indexes
        ALTER INDEX IF EXISTS idx_student_weaknesses_user_id 
        RENAME TO idx_student_weaknesses_student_id;
        
        ALTER INDEX IF EXISTS idx_student_weaknesses_user_knowledge 
        RENAME TO idx_student_weaknesses_student_knowledge;
    END IF;
END $$;

-- Revert: Rename user_id back to student_id in student_mistakes table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kedge_practice' 
        AND table_name = 'student_mistakes' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE kedge_practice.student_mistakes 
        RENAME COLUMN user_id TO student_id;
        
        -- Revert indexes
        ALTER INDEX IF EXISTS idx_student_mistakes_user_id 
        RENAME TO idx_student_mistakes_student_id;
        
        ALTER INDEX IF EXISTS idx_student_mistakes_user_quiz 
        RENAME TO idx_student_mistakes_student_quiz;
    END IF;
END $$;

-- Remove comments
COMMENT ON COLUMN kedge_practice.student_weaknesses.student_id IS NULL;
COMMENT ON COLUMN kedge_practice.student_mistakes.student_id IS NULL;