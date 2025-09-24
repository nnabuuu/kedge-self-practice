#!/bin/bash

# Script to dump quiz records with empty/null/undefined options
# This finds problematic quiz records where options are missing or invalid

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Dumping Quiz Records with Empty/Invalid Options ===${NC}"
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
OUTPUT_FILE="$OUTPUT_DIR/empty_options_${TIMESTAMP}.txt"
JSON_FILE="$OUTPUT_DIR/empty_options_${TIMESTAMP}.json"
SQL_FILE="$OUTPUT_DIR/empty_options_${TIMESTAMP}.sql"

echo -e "${YELLOW}Database: ${DB_NAME}${NC}"
echo -e "${YELLOW}Output files will be in: ${OUTPUT_DIR}${NC}"
echo ""

# Function to execute SQL and return results
execute_sql() {
    local query="$1"
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c "$query"
}

# Function to execute SQL with formatted output
execute_sql_formatted() {
    local query="$1"
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$query"
}

# Count different types of empty options FOR CHOICE QUESTIONS ONLY
echo -e "${GREEN}Analyzing quiz records (single-choice and multiple-choice only)...${NC}"

# Count single-choice with NULL options
SC_NULL_COUNT=$(execute_sql "SELECT COUNT(*) FROM kedge_practice.quizzes WHERE type = 'single-choice' AND options IS NULL")
echo "Single-choice with NULL options: $SC_NULL_COUNT"

# Count multiple-choice with NULL options
MC_NULL_COUNT=$(execute_sql "SELECT COUNT(*) FROM kedge_practice.quizzes WHERE type = 'multiple-choice' AND options IS NULL")
echo "Multiple-choice with NULL options: $MC_NULL_COUNT"

# Count choice questions with empty JSON array []
SC_EMPTY_ARRAY=$(execute_sql "SELECT COUNT(*) FROM kedge_practice.quizzes WHERE type = 'single-choice' AND options::text = '[]'")
MC_EMPTY_ARRAY=$(execute_sql "SELECT COUNT(*) FROM kedge_practice.quizzes WHERE type = 'multiple-choice' AND options::text = '[]'")
echo "Single-choice with empty array []: $SC_EMPTY_ARRAY"
echo "Multiple-choice with empty array []: $MC_EMPTY_ARRAY"

# Count choice questions with array of empty strings ["", "", "", ""]
EMPTY_STRINGS_COUNT=$(execute_sql "SELECT COUNT(*) FROM kedge_practice.quizzes WHERE 
    type IN ('single-choice', 'multiple-choice') AND
    options IS NOT NULL AND 
    jsonb_array_length(options) > 0 AND
    NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(options) AS elem 
        WHERE trim(elem) != ''
    )")
echo "Choice questions with only empty strings: $EMPTY_STRINGS_COUNT"

# Count choice questions with some empty options
PARTIAL_EMPTY_COUNT=$(execute_sql "SELECT COUNT(*) FROM kedge_practice.quizzes WHERE 
    type IN ('single-choice', 'multiple-choice') AND
    options IS NOT NULL AND 
    EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(options) AS elem 
        WHERE trim(elem) = ''
    )")
echo "Choice questions with at least one empty option: $PARTIAL_EMPTY_COUNT"

TOTAL_PROBLEMATIC=$(execute_sql "SELECT COUNT(*) FROM kedge_practice.quizzes WHERE 
    type IN ('single-choice', 'multiple-choice') AND (
        options IS NULL OR 
        options::text = '[]' OR
        options::text = 'null' OR
        (options IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(options) AS elem 
            WHERE trim(elem) != ''
        ))
    )")

echo -e "${CYAN}Total problematic CHOICE questions: $TOTAL_PROBLEMATIC${NC}"
echo ""

# Create detailed text report
cat > "$OUTPUT_FILE" << EOF
================================================================================
Choice Questions (Single/Multiple) with Empty/Invalid Options
Generated: $(date)
Database: $DB_NAME
================================================================================

SUMMARY
-------
Single-choice with NULL options: $SC_NULL_COUNT
Single-choice with empty array []: $SC_EMPTY_ARRAY
Multiple-choice with NULL options: $MC_NULL_COUNT
Multiple-choice with empty array []: $MC_EMPTY_ARRAY
Choice questions with only empty strings: $EMPTY_STRINGS_COUNT
Choice questions with at least one empty option: $PARTIAL_EMPTY_COUNT
Total problematic CHOICE questions: $TOTAL_PROBLEMATIC

================================================================================
DETAILED RECORDS
================================================================================

EOF

# Export detailed records
echo -e "${BLUE}Exporting detailed records...${NC}"

PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A << SQL >> "$OUTPUT_FILE"
SELECT 
    E'\\n' || REPEAT('=', 80) || E'\\n' ||
    '【' || ROW_NUMBER() OVER (ORDER BY created_at DESC) || '】 ' || 
    'ID: ' || id || E'\\n' ||
    'Type: ' || type || ' | ' ||
    'Knowledge Point: ' || COALESCE(knowledge_point_id, 'N/A') || ' | ' ||
    'Date: ' || created_at::date || E'\\n' ||
    REPEAT('-', 80) || E'\\n' ||
    'Options Status: ' || 
    CASE 
        WHEN options IS NULL THEN 'NULL'
        WHEN options::text = '[]' THEN 'Empty Array []'
        WHEN options::text = 'null' THEN 'null value'
        ELSE 'Array with ' || jsonb_array_length(options) || ' elements'
    END || E'\\n' ||
    'Raw Options: ' || COALESCE(options::text, 'NULL') || E'\\n\\n' ||
    '题目:' || E'\\n' || question || E'\\n\\n' ||
    '答案: ' || answer::text || E'\\n' ||
    CASE 
        WHEN options IS NOT NULL AND jsonb_array_length(options) > 0 THEN
            '选项详情:' || E'\\n' || 
            (SELECT string_agg(
                '  [' || (ordinality - 1) || '] "' || 
                COALESCE(elem, 'null') || 
                '" (length: ' || length(elem) || ', trimmed: ' || length(trim(elem)) || ')',
                E'\\n' ORDER BY ordinality
            ) FROM jsonb_array_elements_text(options) WITH ORDINALITY AS t(elem, ordinality))
        ELSE ''
    END || E'\\n'
FROM kedge_practice.quizzes
WHERE 
    type IN ('single-choice', 'multiple-choice') AND (
        options IS NULL OR 
        options::text = '[]' OR
        options::text = 'null' OR
        (options IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(options) AS elem 
            WHERE trim(elem) != ''
        ))
    )
ORDER BY created_at DESC;
SQL

echo "" >> "$OUTPUT_FILE"
echo "=================================================================================" >> "$OUTPUT_FILE"
echo "End of Report" >> "$OUTPUT_FILE"
echo "=================================================================================" >> "$OUTPUT_FILE"

# Create JSON export
echo -e "${BLUE}Creating JSON export...${NC}"

cat > "$JSON_FILE" << EOF
{
  "metadata": {
    "generated": "$(date -Iseconds)",
    "database": "$DB_NAME",
    "quiz_types": ["single-choice", "multiple-choice"],
    "statistics": {
      "single_choice_null": $SC_NULL_COUNT,
      "single_choice_empty_array": $SC_EMPTY_ARRAY,
      "multiple_choice_null": $MC_NULL_COUNT,
      "multiple_choice_empty_array": $MC_EMPTY_ARRAY,
      "only_empty_strings": $EMPTY_STRINGS_COUNT,
      "contains_empty_option": $PARTIAL_EMPTY_COUNT,
      "total_problematic": $TOTAL_PROBLEMATIC
    }
  },
  "records": [
EOF

# Export records as JSON
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A << SQL >> "$JSON_FILE"
SELECT row_to_json(q) || CASE 
    WHEN row_number() OVER (ORDER BY created_at DESC) < COUNT(*) OVER () THEN ','
    ELSE ''
END
FROM (
    SELECT 
        id, 
        type, 
        question, 
        options,
        CASE 
            WHEN options IS NULL THEN 'null'
            WHEN options::text = '[]' THEN 'empty_array'
            WHEN options::text = 'null' THEN 'null_value'
            WHEN NOT EXISTS (
                SELECT 1 FROM jsonb_array_elements_text(options) AS elem 
                WHERE trim(elem) != ''
            ) THEN 'only_empty_strings'
            ELSE 'partial_empty'
        END as issue_type,
        answer, 
        alternative_answers,
        knowledge_point_id,
        created_at, 
        updated_at
    FROM kedge_practice.quizzes
    WHERE 
        options IS NULL OR 
        options::text = '[]' OR
        options::text = 'null' OR
        (options IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(options) AS elem 
            WHERE trim(elem) != ''
        ))
    ORDER BY created_at DESC
) q;
SQL

echo '  ]' >> "$JSON_FILE"
echo '}' >> "$JSON_FILE"

# Create SQL dump for fixing/migration
echo -e "${BLUE}Creating SQL dump...${NC}"

cat > "$SQL_FILE" << EOF
-- SQL dump of quiz records with empty/invalid options
-- Generated: $(date)
-- Database: $DB_NAME
-- Total problematic records: $TOTAL_PROBLEMATIC

BEGIN;

-- Backup table for safety
CREATE TABLE IF NOT EXISTS kedge_practice.quizzes_empty_options_backup AS
SELECT * FROM kedge_practice.quizzes
WHERE 
    options IS NULL OR 
    options::text = '[]' OR
    options::text = 'null' OR
    (options IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(options) AS elem 
        WHERE trim(elem) != ''
    ));

-- Records with problematic options
EOF

PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A << SQL >> "$SQL_FILE"
SELECT 
    '-- Record: ' || id || ' (Type: ' || type || ', Options: ' || COALESCE(options::text, 'NULL') || ')' || E'\\n' ||
    'SELECT * FROM kedge_practice.quizzes WHERE id = ' || quote_literal(id) || ';' || E'\\n'
FROM kedge_practice.quizzes
WHERE 
    type IN ('single-choice', 'multiple-choice') AND (
        options IS NULL OR 
        options::text = '[]' OR
        options::text = 'null' OR
        (options IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(options) AS elem 
            WHERE trim(elem) != ''
        ))
    )
ORDER BY created_at DESC;
SQL

cat >> "$SQL_FILE" << EOF

-- Example fixes:
-- UPDATE kedge_practice.quizzes SET options = '["Option A", "Option B", "Option C", "Option D"]'::jsonb WHERE id = 'some-uuid';
-- DELETE FROM kedge_practice.quizzes WHERE options IS NULL AND type = 'single-choice';

COMMIT;
EOF

# Final summary
echo ""
echo -e "${GREEN}=== Export Complete ===${NC}"
echo ""
echo -e "${YELLOW}Files created:${NC}"
echo "  Text Report: $OUTPUT_FILE"
echo "  JSON Export: $JSON_FILE"
echo "  SQL Dump:    $SQL_FILE"
echo ""
echo -e "${YELLOW}Statistics for Choice Questions:${NC}"
echo "  Single-choice with NULL: $SC_NULL_COUNT"
echo "  Single-choice with []: $SC_EMPTY_ARRAY"
echo "  Multiple-choice with NULL: $MC_NULL_COUNT"
echo "  Multiple-choice with []: $MC_EMPTY_ARRAY"
echo "  Only empty strings: $EMPTY_STRINGS_COUNT"
echo "  Total problematic: $TOTAL_PROBLEMATIC"
echo ""
echo -e "${BLUE}To view the text report:${NC}"
echo "  cat $OUTPUT_FILE | less"
echo ""
echo -e "${BLUE}To analyze the JSON:${NC}"
echo "  jq '.records[] | select(.type == \"single-choice\")' $JSON_FILE"