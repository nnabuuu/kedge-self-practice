-- Remove class-related indexes
DROP INDEX IF EXISTS kedge_practice.idx_users_role_class;
DROP INDEX IF EXISTS kedge_practice.idx_users_class;

-- Remove class column
ALTER TABLE kedge_practice.users 
DROP COLUMN IF EXISTS class;