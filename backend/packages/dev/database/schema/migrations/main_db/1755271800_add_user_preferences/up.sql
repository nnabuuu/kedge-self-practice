-- Add preferences column to store user settings as JSON
-- This will store things like last accessed subject, UI preferences, etc.

ALTER TABLE kedge_practice.users 
ADD COLUMN preferences JSONB DEFAULT '{}' NOT NULL;

-- Create index for faster JSON queries
CREATE INDEX idx_users_preferences ON kedge_practice.users USING GIN (preferences);

-- Add some example preferences for existing users (optional)
UPDATE kedge_practice.users 
SET preferences = '{
  "lastAccessedSubject": null,
  "uiSettings": {
    "theme": "light",
    "language": "zh-CN"
  }
}'::jsonb
WHERE preferences = '{}'::jsonb;