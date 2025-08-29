-- Add is_admin flag to users table for admin role management
-- This allows distinguishing admin users from regular teachers and students

ALTER TABLE kedge_practice.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Update existing admin users based on role
UPDATE kedge_practice.users 
SET is_admin = TRUE 
WHERE role = 'admin';

-- Add index for faster admin user queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin 
ON kedge_practice.users(is_admin) 
WHERE is_admin = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN kedge_practice.users.is_admin IS 'Flag to identify admin users with full system access';