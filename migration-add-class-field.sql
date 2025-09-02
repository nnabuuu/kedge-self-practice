-- Migration: Add class field to users table
-- Date: 2025-01-02
-- Description: Adds a class field for student organization

-- Add class column to users table
ALTER TABLE kedge_practice.users 
ADD COLUMN IF NOT EXISTS class VARCHAR(50);

-- Create index for efficient class-based queries
CREATE INDEX IF NOT EXISTS idx_users_class ON kedge_practice.users(class);

-- Update existing students to have a default class (optional)
-- Uncomment if you want to assign a default class to existing students
-- UPDATE kedge_practice.users 
-- SET class = '20250101' 
-- WHERE role = 'student' AND class IS NULL;

-- Verify the changes
-- List all columns in the users table
\d kedge_practice.users

-- Count users by class
SELECT 
    class,
    role,
    COUNT(*) as count
FROM kedge_practice.users
GROUP BY class, role
ORDER BY class, role;