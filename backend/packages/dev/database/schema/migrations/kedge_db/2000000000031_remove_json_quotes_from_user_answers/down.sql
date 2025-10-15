-- Rollback: Re-add JSON quotes to user_answer field
-- Note: This reverts to the buggy behavior where sql.json() adds quotes

-- Add quotes back to values that don't already have them
UPDATE kedge_practice.practice_answers
SET user_answer = '"' || REPLACE(user_answer, '"', '\"') || '"'
WHERE user_answer NOT LIKE '"%"';

-- Remove the comment
COMMENT ON COLUMN kedge_practice.practice_answers.user_answer IS NULL;
