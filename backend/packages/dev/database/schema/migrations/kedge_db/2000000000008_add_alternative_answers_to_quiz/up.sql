-- Add alternative_answers column to quizzes table
ALTER TABLE kedge_practice.quizzes
ADD COLUMN IF NOT EXISTS alternative_answers TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN kedge_practice.quizzes.alternative_answers IS 'Array of alternative correct answers for fill-in-the-blank questions';