-- Remove preferences column and index

DROP INDEX IF EXISTS idx_users_preferences;

ALTER TABLE kedge_practice.users 
DROP COLUMN IF EXISTS preferences;