#!/bin/bash

# =================================================================
# APPLY CONSOLIDATED MIGRATION SCRIPT
# =================================================================
# This script applies the consolidated migration to a database.
# It can be used for new deployments or to recreate the schema.
# =================================================================

set -e  # Exit on error

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-7543}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-kedge_db}"
DB_PASSWORD="${PGPASSWORD:-postgres}"

MIGRATION_DIR="$(dirname "$0")/../schema/migrations/kedge_db/1000000000000_initial_schema"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if migration files exist
if [ ! -f "$MIGRATION_DIR/up.sql" ]; then
    log_error "Migration file not found: $MIGRATION_DIR/up.sql"
    exit 1
fi

# Parse command line arguments
ACTION="${1:-apply}"
FORCE="${2:-no}"

case "$ACTION" in
    apply)
        log_info "Applying consolidated migration to $DB_NAME..."

        # Check if schema already exists
        SCHEMA_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT 1 FROM information_schema.schemata WHERE schema_name = 'kedge_practice'" 2>/dev/null || echo "0")

        if [ "$SCHEMA_EXISTS" = "1" ] && [ "$FORCE" != "force" ]; then
            log_warn "Schema 'kedge_practice' already exists!"
            log_warn "Use '$0 apply force' to force apply (will drop existing schema first)"
            log_warn "Or use '$0 clean' to drop the schema first"
            exit 1
        fi

        if [ "$SCHEMA_EXISTS" = "1" ] && [ "$FORCE" = "force" ]; then
            log_warn "Force mode: Dropping existing schema first..."
            PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATION_DIR/down.sql"
            log_info "Existing schema dropped"
        fi

        # Apply the migration
        log_info "Applying up migration..."
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATION_DIR/up.sql"

        log_info "Migration applied successfully!"

        # Verify tables were created
        log_info "Verifying tables..."
        TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'kedge_practice'")
        log_info "Created $TABLE_COUNT tables in kedge_practice schema"

        # List created tables
        log_info "Tables created:"
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'kedge_practice' ORDER BY table_name"
        ;;

    rollback|down)
        log_info "Rolling back consolidated migration..."

        # Check if schema exists
        SCHEMA_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT 1 FROM information_schema.schemata WHERE schema_name = 'kedge_practice'" 2>/dev/null || echo "0")

        if [ "$SCHEMA_EXISTS" = "0" ]; then
            log_warn "Schema 'kedge_practice' does not exist. Nothing to rollback."
            exit 0
        fi

        # Apply the down migration
        log_info "Applying down migration..."
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATION_DIR/down.sql"

        log_info "Migration rolled back successfully!"
        ;;

    verify)
        log_info "Verifying schema..."

        # Check if schema exists
        SCHEMA_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT 1 FROM information_schema.schemata WHERE schema_name = 'kedge_practice'" 2>/dev/null || echo "0")

        if [ "$SCHEMA_EXISTS" = "0" ]; then
            log_error "Schema 'kedge_practice' does not exist!"
            exit 1
        fi

        # Expected tables
        EXPECTED_TABLES="users knowledge_points quizzes practice_sessions practice_answers practice_strategies student_weaknesses student_mistakes knowledge_points_metadata attachments"

        log_info "Checking tables..."
        for table in $EXPECTED_TABLES; do
            TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema = 'kedge_practice' AND table_name = '$table'" 2>/dev/null || echo "0")
            if [ "$TABLE_EXISTS" = "1" ]; then
                echo -e "  ${GREEN}✓${NC} $table"
            else
                echo -e "  ${RED}✗${NC} $table (missing)"
            fi
        done

        # Check views
        log_info "Checking views..."
        VIEW_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT 1 FROM information_schema.views WHERE table_schema = 'kedge_practice' AND table_name = 'practice_statistics_view'" 2>/dev/null || echo "0")
        if [ "$VIEW_EXISTS" = "1" ]; then
            echo -e "  ${GREEN}✓${NC} practice_statistics_view"
        else
            echo -e "  ${RED}✗${NC} practice_statistics_view (missing)"
        fi

        # Count total objects
        TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'kedge_practice'")
        INDEX_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'kedge_practice'")
        TRIGGER_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'kedge_practice'")

        log_info "Summary:"
        echo "  Tables: $TABLE_COUNT"
        echo "  Indexes: $INDEX_COUNT"
        echo "  Triggers: $TRIGGER_COUNT"
        ;;

    *)
        echo "Usage: $0 [apply|rollback|verify] [force]"
        echo ""
        echo "Commands:"
        echo "  apply       Apply the consolidated migration"
        echo "  apply force Force apply (drops existing schema first)"
        echo "  rollback    Rollback the consolidated migration"
        echo "  verify      Verify the schema is correctly installed"
        echo ""
        echo "Environment variables:"
        echo "  DB_HOST     Database host (default: localhost)"
        echo "  DB_PORT     Database port (default: 7543)"
        echo "  DB_USER     Database user (default: postgres)"
        echo "  DB_NAME     Database name (default: kedge_db)"
        echo "  PGPASSWORD  Database password (default: postgres)"
        exit 1
        ;;
esac
