-- Remove JSON quotes from user_answer field in practice_answers
-- This fixes the bug where sql.json() was adding unnecessary JSON serialization
-- Note: user_answer is stored as JSONB

-- Step 1: Convert JSONB strings that are actually numbers to JSONB numbers
-- This removes the quotes when casting to text
-- Example: JSONB "3" (string) -> JSONB 3 (number) -> TEXT 3 (no quotes)
UPDATE kedge_practice.practice_answers
SET user_answer = to_jsonb((user_answer #>> '{}')::numeric)
WHERE jsonb_typeof(user_answer) = 'string'
  AND (user_answer #>> '{}') ~ '^[0-9]+$';

-- Step 2: For other string values, keep them as JSONB strings but document the behavior
COMMENT ON COLUMN kedge_practice.practice_answers.user_answer IS
  'User submitted answer stored as JSONB. Numeric answers stored as numbers, text answers as strings. For fill-in-blank, multiple answers are separated by |||';
