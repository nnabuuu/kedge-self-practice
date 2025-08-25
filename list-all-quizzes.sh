#!/bin/bash

# Database connection details
DB_HOST="localhost"
DB_PORT="7543"
DB_NAME="kedge_db"
DB_USER="postgres"
DB_PASS="postgres"

echo "Listing all quizzes in database..."
echo "================================"

# Export password for psql
export PGPASSWORD=$DB_PASS

# List all quizzes with their types
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Show all quizzes with their details
SELECT 
    id,
    type,
    question,
    answer,
    knowledge_point_id
FROM kedge_practice.quizzes
ORDER BY type, id;
EOF

echo ""
echo "Listing completed."