-- Remove added columns
ALTER TABLE kedge_practice.practice_sessions
DROP COLUMN IF EXISTS answered_questions,
DROP COLUMN IF EXISTS incorrect_answers,
DROP COLUMN IF EXISTS skipped_questions,
DROP COLUMN IF EXISTS time_spent_seconds;