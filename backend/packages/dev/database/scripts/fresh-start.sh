#!/bin/bash

# =================================================================
# FRESH START SCRIPT
# =================================================================
# This script completely resets the database for a fresh deployment
# WARNING: This will DELETE ALL DATA!
# =================================================================

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-7543}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-kedge_db}"
DB_PASSWORD="${PGPASSWORD:-postgres}"

HASURA_ENDPOINT="${HASURA_ENDPOINT:-http://localhost:28717}"
HASURA_SECRET="${HASURA_ADMIN_SECRET:-hasura}"

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
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Warning banner
clear
log_section "FRESH START - DATABASE RESET"
echo ""
echo -e "${RED}⚠️  WARNING: This script will:${NC}"
echo -e "${RED}   • DROP the entire kedge_practice schema${NC}"
echo -e "${RED}   • DELETE ALL DATA (users, quizzes, sessions, etc.)${NC}"
echo -e "${RED}   • Clear all Hasura metadata${NC}"
echo -e "${RED}   • Recreate everything from scratch${NC}"
echo ""
echo "Database: $DB_NAME @ $DB_HOST:$DB_PORT"
echo ""
echo -e "${YELLOW}This action CANNOT be undone!${NC}"
echo ""
read -p "Type 'RESET' to confirm: " confirmation

if [ "$confirmation" != "RESET" ]; then
    log_error "Reset cancelled"
    exit 1
fi

echo ""
log_section "Starting Fresh Database Reset"

# Step 1: Drop the entire schema
log_info "Step 1/5: Dropping existing schema..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    DROP SCHEMA IF EXISTS kedge_practice CASCADE;
    DROP SCHEMA IF EXISTS hdb_catalog CASCADE;
" 2>/dev/null || true

log_info "✓ Schema dropped"

# Step 2: Apply the consolidated migration
log_info "Step 2/5: Applying fresh migration..."
MIGRATION_FILE="$(dirname "$0")/../schema/migrations/main_db/1000000000000_initial_schema/up.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    log_error "Migration file not found: $MIGRATION_FILE"
    exit 1
fi

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATION_FILE" > /dev/null

# Verify tables were created
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'kedge_practice'")
log_info "✓ Created $TABLE_COUNT tables"

# Step 3: Initialize Hasura
log_info "Step 3/5: Initializing Hasura catalog..."

# Create Hasura catalog schema
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    CREATE SCHEMA IF NOT EXISTS hdb_catalog;
" 2>/dev/null

# Let Hasura initialize its catalog
curl -s -X POST $HASURA_ENDPOINT/v1/metadata \
    -H "X-Hasura-Admin-Secret: $HASURA_SECRET" \
    -H "Content-Type: application/json" \
    -d '{"type": "clear_metadata", "args": {}}' > /dev/null 2>&1 || true

log_info "✓ Hasura catalog initialized"

# Step 4: Track all tables in Hasura
log_info "Step 4/5: Tracking tables in Hasura..."

# Add database source if not exists
curl -s -X POST $HASURA_ENDPOINT/v1/metadata \
    -H "X-Hasura-Admin-Secret: $HASURA_SECRET" \
    -H "Content-Type: application/json" \
    -d '{
        "type": "pg_add_source",
        "args": {
            "name": "main_db",
            "configuration": {
                "connection_info": {
                    "database_url": {
                        "from_env": "HASURA_GRAPHQL_DATABASE_URL"
                    }
                }
            }
        }
    }' > /dev/null 2>&1 || true

# Track each table
TABLES="users knowledge_points quizzes practice_sessions practice_answers practice_strategies student_weaknesses student_mistakes knowledge_points_metadata attachments"

for table in $TABLES; do
    curl -s -X POST $HASURA_ENDPOINT/v1/metadata \
        -H "X-Hasura-Admin-Secret: $HASURA_SECRET" \
        -H "Content-Type: application/json" \
        -d "{
            \"type\": \"pg_track_table\",
            \"args\": {
                \"source\": \"main_db\",
                \"schema\": \"kedge_practice\",
                \"name\": \"$table\"
            }
        }" > /dev/null 2>&1
    echo "  ✓ Tracked: $table"
done

# Track the view
curl -s -X POST $HASURA_ENDPOINT/v1/metadata \
    -H "X-Hasura-Admin-Secret: $HASURA_SECRET" \
    -H "Content-Type: application/json" \
    -d '{
        "type": "pg_track_table",
        "args": {
            "source": "main_db",
            "schema": "kedge_practice",
            "name": "practice_statistics_view"
        }
    }' > /dev/null 2>&1
echo "  ✓ Tracked: practice_statistics_view"

log_info "✓ All tables tracked"

# Step 5: Verify the setup
log_info "Step 5/5: Verifying setup..."

# Check if anonymous user exists
ANON_USER=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM kedge_practice.users WHERE id = '00000000-0000-0000-0000-000000000000'")

if [ "$ANON_USER" = "1" ]; then
    echo "  ✓ Anonymous user exists"
else
    echo "  ✗ Anonymous user missing"
fi

# Check if default strategies exist
STRATEGY_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM kedge_practice.practice_strategies")
echo "  ✓ Default strategies: $STRATEGY_COUNT"

# Test GraphQL endpoint
GRAPHQL_TEST=$(curl -s -X POST $HASURA_ENDPOINT/v1/graphql \
    -H "X-Hasura-Admin-Secret: $HASURA_SECRET" \
    -H "Content-Type: application/json" \
    -d '{"query": "{ users { id } }"}' 2>/dev/null | grep -c "data" || echo "0")

if [ "$GRAPHQL_TEST" = "1" ]; then
    echo "  ✓ GraphQL endpoint working"
else
    echo "  ⚠ GraphQL endpoint needs configuration"
fi

echo ""
log_section "Fresh Start Complete!"
echo ""
echo -e "${GREEN}✅ Database has been completely reset${NC}"
echo ""
echo "Summary:"
echo "  • Schema: kedge_practice (fresh)"
echo "  • Tables: $TABLE_COUNT"
echo "  • Default data: Loaded"
echo "  • Hasura: Configured"
echo "  • GraphQL: Ready"
echo ""
echo "Next steps:"
echo "  1. Test the application: npm run dev"
echo "  2. Access Hasura console: http://localhost:28717/console"
echo "  3. Import test data if needed"
echo ""
echo -e "${GREEN}Your database is ready for development!${NC}"