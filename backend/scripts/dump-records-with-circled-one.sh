#!/bin/bash

# Script to dump database records containing the character ①
# This searches across relevant tables for quiz content with this special character

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Dumping Records with Character ① ===${NC}"
echo ""

# Load environment variables
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Database connection parameters
# Check if we should use production database
USE_PROD="${USE_PROD:-false}"

if [ "$USE_PROD" = "true" ]; then
    # Production database (Aliyun RDS)
    DB_HOST="${DB_HOST:-pgm-bp10tol2zf3i95f68o.pg.rds.aliyuncs.com}"
    DB_PORT="${DB_PORT:-5432}"
    DB_USER="${DB_USER:-kedgetech}"
    DB_PASS="${DB_PASS:-Nie112233}"
    DB_NAME="${DB_NAME:-kedge_db}"
    echo -e "${YELLOW}Using production database${NC}"
else
    # Local development database
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-7543}"
    DB_USER="${DB_USER:-postgres}"
    DB_PASS="${DB_PASS:-postgres}"
    DB_NAME="${DB_NAME:-kedge_db}"
    echo -e "${YELLOW}Using local database${NC}"
fi

# Output directory
OUTPUT_DIR="$PROJECT_ROOT/backend/data-dumps"
mkdir -p "$OUTPUT_DIR"

# Timestamp for file naming
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="$OUTPUT_DIR/records_with_circled_one_${TIMESTAMP}.sql"
SUMMARY_FILE="$OUTPUT_DIR/records_with_circled_one_${TIMESTAMP}_summary.txt"

echo -e "${YELLOW}Database: ${DB_NAME}${NC}"
echo -e "${YELLOW}Output: ${OUTPUT_FILE}${NC}"
echo ""

# Function to execute SQL and return results
execute_sql() {
    local query="$1"
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c "$query"
}

# Function to execute SQL and format output
execute_sql_formatted() {
    local query="$1"
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$query"
}

# Start summary file
cat > "$SUMMARY_FILE" << EOF
Database Records Containing Character ①
Generated: $(date)
Database: $DB_NAME
========================================

EOF

# Check quizzes table
echo -e "${GREEN}Checking quizzes table...${NC}"
QUIZ_COUNT=$(execute_sql "SELECT COUNT(*) FROM kedge_practice.quizzes WHERE 
    question LIKE '%①%' OR 
    answer::text LIKE '%①%' OR 
    options::text LIKE '%①%' OR
    alternative_answers::text LIKE '%①%'")

echo "Found $QUIZ_COUNT quiz records with ①"
echo "Quizzes table: $QUIZ_COUNT records" >> "$SUMMARY_FILE"

# Check knowledge_points table
echo -e "${GREEN}Checking knowledge_points table...${NC}"
KP_COUNT=$(execute_sql "SELECT COUNT(*) FROM kedge_practice.knowledge_points WHERE 
    topic LIKE '%①%'")

echo "Found $KP_COUNT knowledge point records with ①"
echo "Knowledge points table: $KP_COUNT records" >> "$SUMMARY_FILE"

# Check practice_answers table
echo -e "${GREEN}Checking practice_answers table...${NC}"
PA_COUNT=$(execute_sql "SELECT COUNT(*) FROM kedge_practice.practice_answers WHERE 
    user_answer::text LIKE '%①%'")

echo "Found $PA_COUNT practice answer records with ①"
echo "Practice answers table: $PA_COUNT records" >> "$SUMMARY_FILE"

echo "" >> "$SUMMARY_FILE"
echo "========================================" >> "$SUMMARY_FILE"

# Start SQL dump file
cat > "$OUTPUT_FILE" << EOF
-- Database dump of records containing character ①
-- Generated: $(date)
-- Database: $DB_NAME

BEGIN;

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

EOF

# Dump quiz records
if [ "$QUIZ_COUNT" -gt 0 ]; then
    echo -e "${BLUE}Dumping quiz records...${NC}"
    
    cat >> "$OUTPUT_FILE" << EOF

-- ========================================
-- Quizzes containing ①
-- Count: $QUIZ_COUNT
-- ========================================

EOF
    
    # Export quiz data
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A << SQL >> "$OUTPUT_FILE"
SELECT 'INSERT INTO kedge_practice.quizzes (id, type, question, options, answer, alternative_answers, original_paragraph, images, tags, knowledge_point_id, created_at, updated_at) VALUES (' ||
    quote_literal(id) || ', ' ||
    quote_literal(type) || ', ' ||
    quote_literal(question) || ', ' ||
    CASE 
        WHEN options IS NULL THEN 'NULL'
        ELSE quote_literal(options::text) || '::jsonb'
    END || ', ' ||
    CASE 
        WHEN answer IS NULL THEN 'NULL'
        ELSE quote_literal(answer::text) || '::jsonb'
    END || ', ' ||
    CASE 
        WHEN alternative_answers IS NULL THEN 'NULL'
        ELSE 'ARRAY[' || array_to_string(ARRAY(SELECT quote_literal(elem) FROM unnest(alternative_answers) elem), ',') || ']::text[]'
    END || ', ' ||
    CASE 
        WHEN original_paragraph IS NULL THEN 'NULL'
        ELSE quote_literal(original_paragraph)
    END || ', ' ||
    CASE 
        WHEN images IS NULL THEN 'NULL'
        ELSE quote_literal(images::text) || '::jsonb'
    END || ', ' ||
    CASE 
        WHEN tags IS NULL THEN 'NULL'
        ELSE quote_literal(tags::text) || '::jsonb'
    END || ', ' ||
    CASE 
        WHEN knowledge_point_id IS NULL THEN 'NULL'
        ELSE quote_literal(knowledge_point_id)
    END || ', ' ||
    quote_literal(created_at::text) || '::timestamp, ' ||
    quote_literal(updated_at::text) || '::timestamp' ||
    ') ON CONFLICT (id) DO UPDATE SET ' ||
    'type = EXCLUDED.type, ' ||
    'question = EXCLUDED.question, ' ||
    'options = EXCLUDED.options, ' ||
    'answer = EXCLUDED.answer, ' ||
    'alternative_answers = EXCLUDED.alternative_answers, ' ||
    'original_paragraph = EXCLUDED.original_paragraph, ' ||
    'images = EXCLUDED.images, ' ||
    'tags = EXCLUDED.tags, ' ||
    'knowledge_point_id = EXCLUDED.knowledge_point_id, ' ||
    'updated_at = EXCLUDED.updated_at;'
FROM kedge_practice.quizzes
WHERE question LIKE '%①%' OR 
      answer::text LIKE '%①%' OR 
      options::text LIKE '%①%' OR
      alternative_answers::text LIKE '%①%'
ORDER BY created_at DESC;
SQL
    
    # Add sample records to summary
    echo "" >> "$SUMMARY_FILE"
    echo "Sample Quiz Records (first 5):" >> "$SUMMARY_FILE"
    echo "-------------------------------" >> "$SUMMARY_FILE"
    execute_sql_formatted "SELECT id, type, LEFT(question, 100) as question_preview 
        FROM kedge_practice.quizzes 
        WHERE question LIKE '%①%' OR 
              answer::text LIKE '%①%' OR 
              options::text LIKE '%①%' OR
              alternative_answers::text LIKE '%①%'
        LIMIT 5" >> "$SUMMARY_FILE"
fi

# Dump knowledge point records
if [ "$KP_COUNT" -gt 0 ]; then
    echo -e "${BLUE}Dumping knowledge point records...${NC}"
    
    cat >> "$OUTPUT_FILE" << EOF

-- ========================================
-- Knowledge points containing ①
-- Count: $KP_COUNT
-- ========================================

EOF
    
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A << SQL >> "$OUTPUT_FILE"
SELECT 'INSERT INTO kedge_practice.knowledge_points (id, topic, volume, unit, lesson, sub, created_at, updated_at) VALUES (' ||
    quote_literal(id) || ', ' ||
    quote_literal(topic) || ', ' ||
    CASE 
        WHEN volume IS NULL THEN 'NULL'
        ELSE quote_literal(volume)
    END || ', ' ||
    CASE 
        WHEN unit IS NULL THEN 'NULL'
        ELSE quote_literal(unit)
    END || ', ' ||
    CASE 
        WHEN lesson IS NULL THEN 'NULL'
        ELSE quote_literal(lesson)
    END || ', ' ||
    CASE 
        WHEN sub IS NULL THEN 'NULL'
        ELSE quote_literal(sub)
    END || ', ' ||
    quote_literal(created_at::text) || '::timestamp, ' ||
    quote_literal(updated_at::text) || '::timestamp' ||
    ') ON CONFLICT (id) DO UPDATE SET ' ||
    'topic = EXCLUDED.topic, ' ||
    'volume = EXCLUDED.volume, ' ||
    'unit = EXCLUDED.unit, ' ||
    'lesson = EXCLUDED.lesson, ' ||
    'sub = EXCLUDED.sub, ' ||
    'updated_at = EXCLUDED.updated_at;'
FROM kedge_practice.knowledge_points
WHERE topic LIKE '%①%'
ORDER BY created_at DESC;
SQL
    
    # Add sample records to summary
    echo "" >> "$SUMMARY_FILE"
    echo "Sample Knowledge Point Records (first 5):" >> "$SUMMARY_FILE"
    echo "-----------------------------------------" >> "$SUMMARY_FILE"
    execute_sql_formatted "SELECT id, topic, volume, unit 
        FROM kedge_practice.knowledge_points 
        WHERE topic LIKE '%①%'
        LIMIT 5" >> "$SUMMARY_FILE"
fi

# Complete SQL dump
cat >> "$OUTPUT_FILE" << EOF

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

COMMIT;

-- End of dump
EOF

# Create a JSON export as well for easier analysis
JSON_FILE="$OUTPUT_DIR/records_with_circled_one_${TIMESTAMP}.json"
echo -e "${BLUE}Creating JSON export...${NC}"

cat > "$JSON_FILE" << EOF
{
  "metadata": {
    "generated": "$(date -Iseconds)",
    "database": "$DB_NAME",
    "character_searched": "①"
  },
EOF

# Export quizzes as JSON
echo '  "quizzes": [' >> "$JSON_FILE"
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A << SQL >> "$JSON_FILE"
SELECT row_to_json(q) || CASE 
    WHEN row_number() OVER (ORDER BY created_at DESC) < COUNT(*) OVER () THEN ','
    ELSE ''
END
FROM (
    SELECT id, type, question, options, answer, alternative_answers, 
           original_paragraph, images, tags, knowledge_point_id,
           created_at, updated_at
    FROM kedge_practice.quizzes
    WHERE question LIKE '%①%' OR 
          answer::text LIKE '%①%' OR 
          options::text LIKE '%①%' OR
          alternative_answers::text LIKE '%①%'
    ORDER BY created_at DESC
) q;
SQL
echo '  ],' >> "$JSON_FILE"

# Export knowledge points as JSON
echo '  "knowledge_points": [' >> "$JSON_FILE"
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A << SQL >> "$JSON_FILE"
SELECT row_to_json(k) || CASE 
    WHEN row_number() OVER (ORDER BY created_at DESC) < COUNT(*) OVER () THEN ','
    ELSE ''
END
FROM (
    SELECT id, topic, volume, unit, lesson, sub,
           created_at, updated_at
    FROM kedge_practice.knowledge_points
    WHERE topic LIKE '%①%'
    ORDER BY created_at DESC
) k;
SQL
echo '  ]' >> "$JSON_FILE"
echo '}' >> "$JSON_FILE"

# Final summary
echo ""
echo -e "${GREEN}=== Dump Complete ===${NC}"
echo ""
echo -e "${YELLOW}Files created:${NC}"
echo "  SQL Dump:  $OUTPUT_FILE"
echo "  JSON Export: $JSON_FILE"
echo "  Summary:   $SUMMARY_FILE"
echo ""
echo -e "${YELLOW}Statistics:${NC}"
echo "  Quizzes with ①: $QUIZ_COUNT"
echo "  Knowledge points with ①: $KP_COUNT"
echo "  Practice answers with ①: $PA_COUNT"
echo ""
echo -e "${BLUE}To restore the SQL dump:${NC}"
echo "  PGPASSWORD='$DB_PASS' psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < $OUTPUT_FILE"
echo ""
echo -e "${BLUE}To view the JSON export:${NC}"
echo "  jq '.' $JSON_FILE | less"