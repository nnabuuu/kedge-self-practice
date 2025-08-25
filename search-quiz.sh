#!/bin/bash

# Database connection details
DB_HOST="localhost"
DB_PORT="7543"
DB_NAME="kedge_db"
DB_USER="postgres"
DB_PASS="postgres"

echo "Searching for quiz question..."
echo "================================"

# Export password for psql
export PGPASSWORD=$DB_PASS

# Search for the specific quiz
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Search for quiz containing the text
SELECT 
    id,
    type,
    question,
    options,
    answer,
    knowledge_point_id
FROM kedge_practice.quizzes
WHERE question LIKE '%嬴政兼采三皇五帝名号%'
   OR question LIKE '%确立______制度%'
   OR question LIKE '%嬴政%';

-- Also search more broadly
SELECT 
    id,
    type,
    LEFT(question, 100) as question_preview
FROM kedge_practice.quizzes
WHERE question LIKE '%皇帝%'
   OR question LIKE '%制度%';
EOF

echo ""
echo "Search completed."