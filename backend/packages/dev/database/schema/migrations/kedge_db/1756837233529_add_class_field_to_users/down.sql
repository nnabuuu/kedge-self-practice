-- Drop the index first
DROP INDEX IF EXISTS kedge_practice.idx_users_class;

-- Remove the class column
ALTER TABLE kedge_practice.users 
DROP COLUMN IF EXISTS class;