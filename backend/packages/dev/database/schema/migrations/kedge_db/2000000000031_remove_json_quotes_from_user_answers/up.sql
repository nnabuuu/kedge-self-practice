-- Remove JSON quotes from user_answer field in practice_answers
-- This fixes the bug where sql.json() was adding unnecessary JSON serialization

-- Step 1: Remove surrounding quotes from JSON-serialized values
-- Example: "3" becomes 3, "hello" becomes hello, "1|||2" becomes 1|||2
UPDATE kedge_practice.practice_answers
SET user_answer = CASE
  WHEN user_answer LIKE '"%"' THEN
    -- Remove the first and last quote, and unescape any internal quotes
    REPLACE(SUBSTRING(user_answer FROM 2 FOR LENGTH(user_answer) - 2), '\"', '"')
  ELSE
    user_answer
END
WHERE user_answer LIKE '"%"';

-- Step 2: Add a comment to document the fix
COMMENT ON COLUMN kedge_practice.practice_answers.user_answer IS
  'User submitted answer stored as plain text. For fill-in-blank, multiple answers are separated by |||';
