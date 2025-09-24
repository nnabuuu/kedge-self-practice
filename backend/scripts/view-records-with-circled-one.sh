#!/bin/bash

# Script to view database records containing the character ① in readable format
# This shows the actual quiz content, not SQL dumps

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Viewing Records with Character ① ===${NC}"
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

# Count records
echo -e "${GREEN}Counting records...${NC}"
QUIZ_COUNT=$(execute_sql "SELECT COUNT(*) FROM kedge_practice.quizzes WHERE 
    question LIKE '%①%' OR 
    answer::text LIKE '%①%' OR 
    options::text LIKE '%①%' OR
    alternative_answers::text LIKE '%①%'")

echo -e "${CYAN}Found $QUIZ_COUNT quiz records with ①${NC}"
echo ""

# Ask user how to proceed
echo -e "${YELLOW}Display options:${NC}"
echo "1. Show all records (may be long)"
echo "2. Show first 20 records"
echo "3. Show specific number of records"
echo "4. Export to text file"
echo "5. Search for specific pattern within these records"
echo ""
read -p "Choose option (1-5): " OPTION

case $OPTION in
    1)
        LIMIT=""
        ;;
    2)
        LIMIT="LIMIT 20"
        ;;
    3)
        read -p "How many records to show? " NUM
        LIMIT="LIMIT $NUM"
        ;;
    4)
        OUTPUT_FILE="$PROJECT_ROOT/backend/data-dumps/quiz_text_with_circled_one_$(date +%Y%m%d_%H%M%S).txt"
        mkdir -p "$PROJECT_ROOT/backend/data-dumps"
        ;;
    5)
        read -p "Enter additional search pattern: " PATTERN
        EXTRA_FILTER=" AND question LIKE '%${PATTERN}%'"
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

# Build the query
QUERY="SELECT 
    ROW_NUMBER() OVER (ORDER BY created_at DESC) as num,
    id,
    type,
    question,
    CASE 
        WHEN options IS NOT NULL THEN options::text 
        ELSE 'N/A' 
    END as options,
    answer::text as answer,
    CASE 
        WHEN alternative_answers IS NOT NULL AND array_length(alternative_answers, 1) > 0 
        THEN array_to_string(alternative_answers, ', ')
        ELSE 'N/A' 
    END as alt_answers,
    CASE 
        WHEN knowledge_point_id IS NOT NULL THEN knowledge_point_id 
        ELSE 'N/A' 
    END as kp_id,
    created_at::date as date_created
FROM kedge_practice.quizzes
WHERE (question LIKE '%①%' OR 
       answer::text LIKE '%①%' OR 
       options::text LIKE '%①%' OR
       alternative_answers::text LIKE '%①%')
       ${EXTRA_FILTER:-}
ORDER BY created_at DESC
${LIMIT}"

# Display or export results
if [ "$OPTION" = "4" ]; then
    echo -e "${BLUE}Exporting to file: $OUTPUT_FILE${NC}"
    
    # Write header
    cat > "$OUTPUT_FILE" << EOF
================================================================================
Quiz Records Containing Character ①
Generated: $(date)
Database: $DB_NAME
Total Records: $QUIZ_COUNT
================================================================================

EOF
    
    # Export each record in a readable format
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A << SQL >> "$OUTPUT_FILE"
SELECT 
    E'\\n' || REPEAT('=', 80) || E'\\n' ||
    '【' || ROW_NUMBER() OVER (ORDER BY created_at DESC) || '】 ' || 
    'ID: ' || id || E'\\n' ||
    'Type: ' || type || ' | ' ||
    'Knowledge Point: ' || COALESCE(knowledge_point_id, 'N/A') || ' | ' ||
    'Date: ' || created_at::date || E'\\n' ||
    REPEAT('-', 80) || E'\\n' ||
    '题目:' || E'\\n' || question || E'\\n\\n' ||
    CASE 
        WHEN options IS NOT NULL THEN 
            '选项:' || E'\\n' || 
            regexp_replace(options::text, '[\[\]]', '', 'g') || E'\\n\\n'
        ELSE '' 
    END ||
    '答案: ' || answer::text || E'\\n' ||
    CASE 
        WHEN alternative_answers IS NOT NULL AND array_length(alternative_answers, 1) > 0 THEN
            '备选答案: ' || array_to_string(alternative_answers, ', ') || E'\\n'
        ELSE ''
    END
FROM kedge_practice.quizzes
WHERE (question LIKE '%①%' OR 
       answer::text LIKE '%①%' OR 
       options::text LIKE '%①%' OR
       alternative_answers::text LIKE '%①%')
       ${EXTRA_FILTER:-}
ORDER BY created_at DESC;
SQL
    
    echo "" >> "$OUTPUT_FILE"
    echo "=================================================================================" >> "$OUTPUT_FILE"
    echo "End of Report" >> "$OUTPUT_FILE"
    echo "=================================================================================" >> "$OUTPUT_FILE"
    
    echo -e "${GREEN}Export complete!${NC}"
    echo -e "${CYAN}File saved to: $OUTPUT_FILE${NC}"
    echo ""
    echo "You can view it with:"
    echo "  cat $OUTPUT_FILE | less"
    
else
    # Display in terminal with nice formatting
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
    
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t << SQL
SELECT 
    E'\\n${GREEN}【' || ROW_NUMBER() OVER (ORDER BY created_at DESC) || '】${NC} ' || 
    '${YELLOW}' || type || '${NC} | ' ||
    '${CYAN}KP: ' || COALESCE(knowledge_point_id, 'N/A') || '${NC} | ' ||
    'Date: ' || created_at::date || E'\\n' ||
    '${MAGENTA}' || REPEAT('─', 80) || '${NC}' || E'\\n' ||
    '${GREEN}题目:${NC}' || E'\\n' || question || E'\\n\\n' ||
    CASE 
        WHEN options IS NOT NULL THEN 
            '${YELLOW}选项:${NC}' || E'\\n' || 
            regexp_replace(
                regexp_replace(options::text, '\\[', '', 'g'),
                '\\]', '', 'g'
            ) || E'\\n\\n'
        ELSE '' 
    END ||
    '${CYAN}答案:${NC} ' || answer::text || E'\\n' ||
    CASE 
        WHEN alternative_answers IS NOT NULL AND array_length(alternative_answers, 1) > 0 THEN
            '${MAGENTA}备选答案:${NC} ' || array_to_string(alternative_answers, ', ') || E'\\n'
        ELSE ''
    END ||
    E'\\n'
FROM kedge_practice.quizzes
WHERE (question LIKE '%①%' OR 
       answer::text LIKE '%①%' OR 
       options::text LIKE '%①%' OR
       alternative_answers::text LIKE '%①%')
       ${EXTRA_FILTER:-}
ORDER BY created_at DESC
${LIMIT};
SQL
    
    echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
    
    if [ -n "$LIMIT" ]; then
        echo ""
        echo -e "${YELLOW}Displayed records with limit. Total available: $QUIZ_COUNT${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Done!${NC}"