-- Remove quiz settings from user preferences
-- Note: This is a destructive operation and should be used with caution

-- Remove the quizSettings key from all user preferences
UPDATE kedge_practice.users
SET preferences = preferences - 'quizSettings'
WHERE preferences ? 'quizSettings';

-- Remove the column comment (reverting to original state)
COMMENT ON COLUMN kedge_practice.users.preferences IS NULL;