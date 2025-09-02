-- Add class field to users table
-- Class is a string identifier like '20250101' for students
-- Can be NULL for teachers and admins

ALTER TABLE kedge_practice.users 
ADD COLUMN IF NOT EXISTS class VARCHAR(50);

-- Add index for faster class-based queries
CREATE INDEX IF NOT EXISTS idx_users_class 
ON kedge_practice.users(class) 
WHERE class IS NOT NULL;

-- Add composite index for role and class queries
CREATE INDEX IF NOT EXISTS idx_users_role_class 
ON kedge_practice.users(role, class) 
WHERE role = 'student' AND class IS NOT NULL;

-- Add comment to document the field
COMMENT ON COLUMN kedge_practice.users.class IS 'Class identifier for students (e.g., 20250101). NULL for teachers and admins.';