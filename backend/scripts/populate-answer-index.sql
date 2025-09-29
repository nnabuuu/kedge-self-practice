-- Script to populate answer_index column for existing quiz records
-- This script analyzes the answer field and generates corresponding indices

-- Update single-choice questions where answer is an array of text
UPDATE kedge_practice.quizzes q
SET answer_index = ARRAY[
    (SELECT pos - 1 
     FROM jsonb_array_elements_text(q.options) WITH ORDINALITY AS t(elem, pos)
     WHERE elem = (q.answer->>0)
     LIMIT 1)
]::integer[]
WHERE type = 'single-choice' 
  AND jsonb_typeof(answer) = 'array'
  AND jsonb_array_length(answer) = 1
  AND answer_index IS NULL;

-- Update single-choice questions where answer is a string
UPDATE kedge_practice.quizzes q
SET answer_index = ARRAY[
    (SELECT pos - 1 
     FROM jsonb_array_elements_text(q.options) WITH ORDINALITY AS t(elem, pos)
     WHERE elem = (q.answer#>>'{}')
     LIMIT 1)
]::integer[]
WHERE type = 'single-choice' 
  AND jsonb_typeof(answer) = 'string'
  AND answer_index IS NULL;

-- Update multiple-choice questions (if any exist)
UPDATE kedge_practice.quizzes q
SET answer_index = (
    SELECT ARRAY_AGG((pos - 1)::integer ORDER BY pos)
    FROM jsonb_array_elements(q.answer) AS ans_elem
    JOIN jsonb_array_elements(q.options) WITH ORDINALITY AS t(opt_elem, pos) 
    ON ans_elem = opt_elem
)
WHERE type = 'multiple-choice'
  AND jsonb_typeof(answer) = 'array'
  AND answer_index IS NULL;

-- Show statistics
SELECT 
    type,
    COUNT(*) as total_count,
    COUNT(answer_index) as populated_count,
    COUNT(*) - COUNT(answer_index) as missing_count
FROM kedge_practice.quizzes
GROUP BY type
ORDER BY type;

-- Show some sample conversions for verification
SELECT 
    id,
    type,
    LEFT(question, 50) as question_preview,
    options,
    answer,
    answer_index
FROM kedge_practice.quizzes
WHERE answer_index IS NOT NULL
LIMIT 5;