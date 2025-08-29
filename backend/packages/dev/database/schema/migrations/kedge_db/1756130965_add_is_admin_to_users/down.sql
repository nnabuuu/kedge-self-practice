-- Remove is_admin column and related index

-- Drop the index first
DROP INDEX IF EXISTS kedge_practice.idx_users_is_admin;

-- Remove the column
ALTER TABLE kedge_practice.users 
DROP COLUMN IF EXISTS is_admin;