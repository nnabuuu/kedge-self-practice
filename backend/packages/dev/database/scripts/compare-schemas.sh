#!/bin/bash

# =================================================================
# SCHEMA COMPARISON SCRIPT
# =================================================================
# This script compares two database schemas to verify they match.
# Used to ensure consolidated migration produces same result as
# sequential migrations.
# =================================================================

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-7543}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${PGPASSWORD:-postgres}"

DB1="${1:-kedge_db}"
DB2="${2:-kedge_test_consolidated}"
SCHEMA_NAME="${3:-kedge_practice}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
}

# Function to get schema information
get_schema_info() {
    local db=$1
    local output_dir=$2
    
    # Tables
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $db -tA -c "
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '$SCHEMA_NAME' 
        ORDER BY table_name
    " > "$output_dir/tables.txt"
    
    # Columns with types
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $db -tA -c "
        SELECT 
            table_name || '.' || column_name || ':' || 
            data_type || 
            CASE 
                WHEN character_maximum_length IS NOT NULL 
                THEN '(' || character_maximum_length || ')'
                ELSE ''
            END ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
            CASE WHEN column_default IS NOT NULL THEN ' DEFAULT' ELSE '' END
        FROM information_schema.columns
        WHERE table_schema = '$SCHEMA_NAME'
        ORDER BY table_name, ordinal_position
    " > "$output_dir/columns.txt"
    
    # Constraints
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $db -tA -c "
        SELECT 
            tc.table_name || '.' || tc.constraint_name || ':' || tc.constraint_type
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema = '$SCHEMA_NAME'
        ORDER BY tc.table_name, tc.constraint_name
    " > "$output_dir/constraints.txt"
    
    # Indexes
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $db -tA -c "
        SELECT 
            tablename || '.' || indexname
        FROM pg_indexes
        WHERE schemaname = '$SCHEMA_NAME'
        ORDER BY tablename, indexname
    " > "$output_dir/indexes.txt"
    
    # Triggers
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $db -tA -c "
        SELECT 
            event_object_table || '.' || trigger_name
        FROM information_schema.triggers
        WHERE trigger_schema = '$SCHEMA_NAME'
        ORDER BY event_object_table, trigger_name
    " > "$output_dir/triggers.txt"
    
    # Functions
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $db -tA -c "
        SELECT 
            routine_name || '(' || routine_type || ')'
        FROM information_schema.routines
        WHERE routine_schema = '$SCHEMA_NAME'
        ORDER BY routine_name
    " > "$output_dir/functions.txt"
    
    # Views
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $db -tA -c "
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = '$SCHEMA_NAME'
        ORDER BY table_name
    " > "$output_dir/views.txt"
}

# Create temp directories
TEMP_DIR="/tmp/schema_compare_$$"
mkdir -p "$TEMP_DIR/db1" "$TEMP_DIR/db2"

log_section "Schema Comparison: $DB1 vs $DB2"

# Check if databases exist
DB1_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -w "$DB1" | wc -l)
DB2_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -w "$DB2" | wc -l)

if [ "$DB1_EXISTS" -eq 0 ]; then
    log_error "Database $DB1 does not exist!"
    exit 1
fi

if [ "$DB2_EXISTS" -eq 0 ]; then
    log_error "Database $DB2 does not exist!"
    exit 1
fi

# Get schema information from both databases
log_info "Extracting schema from $DB1..."
get_schema_info "$DB1" "$TEMP_DIR/db1"

log_info "Extracting schema from $DB2..."
get_schema_info "$DB2" "$TEMP_DIR/db2"

# Compare results
DIFFERENCES=0

compare_file() {
    local file=$1
    local description=$2
    
    echo ""
    log_info "Comparing $description..."
    
    if diff -u "$TEMP_DIR/db1/$file" "$TEMP_DIR/db2/$file" > "$TEMP_DIR/diff_$file" 2>&1; then
        echo -e "  ${GREEN}✓${NC} $description match"
    else
        echo -e "  ${RED}✗${NC} $description differ:"
        cat "$TEMP_DIR/diff_$file" | head -20
        DIFFERENCES=$((DIFFERENCES + 1))
    fi
}

# Run comparisons
compare_file "tables.txt" "Tables"
compare_file "columns.txt" "Columns"
compare_file "constraints.txt" "Constraints"
compare_file "indexes.txt" "Indexes"
compare_file "triggers.txt" "Triggers"
compare_file "functions.txt" "Functions"
compare_file "views.txt" "Views"

# Summary
echo ""
log_section "Comparison Summary"

if [ "$DIFFERENCES" -eq 0 ]; then
    log_info "${GREEN}✓ Schemas are identical!${NC}"
    log_info "The consolidated migration produces the same schema as sequential migrations."
else
    log_warn "${RED}✗ Found $DIFFERENCES differences${NC}"
    log_warn "Review the differences above to ensure they are expected."
fi

# Show object counts
echo ""
log_info "Object counts for $DB1:"
for file in tables columns constraints indexes triggers functions views; do
    count=$(wc -l < "$TEMP_DIR/db1/${file}.txt" | tr -d ' ')
    printf "  %-12s: %3d\n" "$file" "$count"
done

echo ""
log_info "Object counts for $DB2:"
for file in tables columns constraints indexes triggers functions views; do
    count=$(wc -l < "$TEMP_DIR/db2/${file}.txt" | tr -d ' ')
    printf "  %-12s: %3d\n" "$file" "$count"
done

# Cleanup
rm -rf "$TEMP_DIR"

exit $DIFFERENCES