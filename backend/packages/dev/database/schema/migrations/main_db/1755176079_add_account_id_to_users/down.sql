-- Revert account_id changes
-- First restore name to be required and unique

-- Ensure all users have a name before making it required
UPDATE kedge_practice.users 
SET name = account_id 
WHERE name IS NULL;

-- Make name field required again
ALTER TABLE kedge_practice.users 
ALTER COLUMN name SET NOT NULL;

-- Restore unique constraint on name
ALTER TABLE kedge_practice.users 
ADD CONSTRAINT users_name_key UNIQUE (name);

-- Drop index and constraints for account_id
DROP INDEX IF EXISTS idx_users_account_id;
ALTER TABLE kedge_practice.users 
DROP CONSTRAINT IF EXISTS users_account_id_unique;

-- Remove account_id column
ALTER TABLE kedge_practice.users 
DROP COLUMN account_id;