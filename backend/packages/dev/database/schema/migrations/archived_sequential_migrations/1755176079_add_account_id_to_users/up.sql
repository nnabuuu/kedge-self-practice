-- Add account_id field to users table
-- This field will be used for login (email or any unique identifier)
-- The name field becomes optional for display purposes

ALTER TABLE kedge_practice.users 
ADD COLUMN account_id VARCHAR(255);

-- Update existing users to use their name as account_id temporarily
UPDATE kedge_practice.users 
SET account_id = name 
WHERE account_id IS NULL;

-- Make account_id NOT NULL and UNIQUE after updating existing records
ALTER TABLE kedge_practice.users 
ALTER COLUMN account_id SET NOT NULL;

ALTER TABLE kedge_practice.users 
ADD CONSTRAINT users_account_id_unique UNIQUE (account_id);

-- Make name field optional (allow NULL)
ALTER TABLE kedge_practice.users 
ALTER COLUMN name DROP NOT NULL;

-- Drop the unique constraint on name since account_id is now the unique identifier
ALTER TABLE kedge_practice.users 
DROP CONSTRAINT IF EXISTS users_name_key;

-- Create index for faster lookups
CREATE INDEX idx_users_account_id ON kedge_practice.users(account_id);