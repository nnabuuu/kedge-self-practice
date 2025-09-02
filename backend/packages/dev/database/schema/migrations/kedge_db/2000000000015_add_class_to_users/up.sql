-- Migration already applied manually
-- The class field has been added to kedge_practice.users table
-- This is a placeholder to mark the migration as complete

-- Verify the column exists (this is a no-op if it already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kedge_practice' 
        AND table_name = 'users' 
        AND column_name = 'class'
    ) THEN
        -- Add class field to users table
        ALTER TABLE kedge_practice.users 
        ADD COLUMN class VARCHAR(50);
        
        -- Add index for faster class-based queries
        CREATE INDEX idx_users_class 
        ON kedge_practice.users(class) 
        WHERE class IS NOT NULL;
        
        -- Add composite index for role and class queries
        CREATE INDEX idx_users_role_class 
        ON kedge_practice.users(role, class) 
        WHERE role = 'student' AND class IS NOT NULL;
        
        -- Add comment to document the field
        COMMENT ON COLUMN kedge_practice.users.class IS 'Class identifier for students (e.g., 20250101). NULL for teachers and admins.';
    END IF;
END $$;