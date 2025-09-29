-- Add answer_index column to store answer as array of integer indices
ALTER TABLE kedge_practice.quizzes
ADD COLUMN IF NOT EXISTS answer_index integer[] DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN kedge_practice.quizzes.answer_index IS 'Array of integer indices (0-based) representing the correct answer positions in the options array. For single-choice, array contains one element. For multiple-choice, array contains multiple elements.';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_quizzes_answer_index ON kedge_practice.quizzes USING GIN (answer_index);