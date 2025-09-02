-- Add class field to users table
ALTER TABLE kedge_practice.users 
ADD COLUMN IF NOT EXISTS class VARCHAR(50);

-- Create index for efficient class-based queries
CREATE INDEX IF NOT EXISTS idx_users_class ON kedge_practice.users(class);

-- Add comment to describe the field
COMMENT ON COLUMN kedge_practice.users.class IS 'Class identifier for students (e.g., 20250101 for Year 2025 January Class 1), NULL for teachers/admins';