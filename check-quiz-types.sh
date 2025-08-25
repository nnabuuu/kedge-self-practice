#!/bin/bash

# Database connection details
DB_HOST="localhost"
DB_PORT="7543"
DB_NAME="kedge_db"
DB_USER="postgres"
DB_PASS="postgres"

echo "Checking quiz types in database..."
echo "================================"

# Export password for psql
export PGPASSWORD=$DB_PASS

# Query to check quiz types and counts
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Check quiz types distribution
SELECT 
    type,
    COUNT(*) as count
FROM kedge_practice.quizzes
GROUP BY type
ORDER BY count DESC;

-- Check if there are any fill-in-the-blank questions
SELECT 
    'Fill-in-the-blank questions:' as info,
    COUNT(*) as count
FROM kedge_practice.quizzes
WHERE type = 'fill-in-the-blank';

-- Show sample fill-in-the-blank questions
SELECT 
    id,
    type,
    LEFT(question, 100) as question_preview,
    answer
FROM kedge_practice.quizzes
WHERE type = 'fill-in-the-blank'
LIMIT 5;

-- Show all unique types
SELECT DISTINCT type
FROM kedge_practice.quizzes;
EOF

echo ""
echo "Script completed."