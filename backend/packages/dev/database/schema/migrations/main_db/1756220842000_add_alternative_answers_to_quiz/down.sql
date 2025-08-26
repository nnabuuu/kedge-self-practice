-- Remove alternative_answers column from quizzes table
ALTER TABLE kedge_practice.quizzes
DROP COLUMN IF EXISTS alternative_answers;