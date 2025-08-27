-- Add default quiz preferences for existing users
-- This migration ensures all existing users have proper quiz settings defaults

-- Update existing users who don't have quiz settings yet
UPDATE kedge_practice.users
SET preferences = jsonb_set(
    COALESCE(preferences, '{}'::jsonb),
    '{quizSettings}',
    '{
        "autoAdvanceDelay": 3,
        "shuffleQuestions": true,
        "showExplanation": true
    }'::jsonb,
    true  -- Create the path if it doesn't exist
)
WHERE NOT (preferences ? 'quizSettings') OR preferences IS NULL OR preferences = '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN kedge_practice.users.preferences IS 
'User preferences in JSON format. Includes:
- lastAccessedSubject: string (subject ID)
- uiSettings: { theme: "light"|"dark", language: string }
- quizSettings: { autoAdvanceDelay: number (0-10, 0=disabled), shuffleQuestions: boolean, showExplanation: boolean }
- Other custom preferences as needed';