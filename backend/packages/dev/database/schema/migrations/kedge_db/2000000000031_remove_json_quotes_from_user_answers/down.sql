-- Rollback: Convert JSONB numbers back to JSONB strings
-- This reverts to the previous behavior where numeric answers were stored as strings

-- Convert JSONB numbers back to strings
UPDATE kedge_practice.practice_answers
SET user_answer = to_jsonb((user_answer #>> '{}')::text)
WHERE jsonb_typeof(user_answer) = 'number';

-- Remove the comment
COMMENT ON COLUMN kedge_practice.practice_answers.user_answer IS NULL;
