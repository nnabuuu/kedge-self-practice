#!/bin/bash

# =================================================================
# HASURA METADATA CLEANUP SCRIPT
# =================================================================
# This script cleans up Hasura metadata for fresh deployments
# with the consolidated migration approach
# =================================================================

set -e

# Configuration
HASURA_ENDPOINT="${HASURA_ENDPOINT:-http://localhost:28717}"
HASURA_SECRET="${HASURA_ADMIN_SECRET:-hasura}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Check if Hasura CLI is available
if ! command -v hasura &> /dev/null; then
    # Try local hasura binary
    if [ -f "bin/hasura" ]; then
        HASURA_CMD="./bin/hasura"
    else
        log_error "Hasura CLI not found. Please install it or run from database directory"
        exit 1
    fi
else
    HASURA_CMD="hasura"
fi

ACTION="${1:-status}"

case "$ACTION" in
    status)
        log_info "Checking Hasura migration status..."
        
        # Check migration status
        $HASURA_CMD migrate status \
            --endpoint $HASURA_ENDPOINT \
            --admin-secret $HASURA_SECRET \
            --database-name main_db \
            --skip-update-check 2>/dev/null || true
        
        # Check if old migrations are tracked
        log_info ""
        log_info "Checking for legacy migration tracking..."
        
        # Query the migration history table if it exists
        curl -s -X POST $HASURA_ENDPOINT/v2/query \
            -H "X-Hasura-Admin-Secret: $HASURA_SECRET" \
            -H "Content-Type: application/json" \
            -d '{
                "type": "run_sql",
                "args": {
                    "source": "main_db",
                    "sql": "SELECT version, dirty FROM hdb_catalog.schema_migrations ORDER BY version DESC LIMIT 10;"
                }
            }' 2>/dev/null | jq -r '.result[][]' 2>/dev/null || echo "No migration tracking found"
        ;;
        
    clean)
        log_warn "This will clean up Hasura migration tracking for fresh deployment"
        log_warn "The database schema will NOT be affected"
        echo ""
        read -p "Continue? (yes/no): " confirm
        
        if [ "$confirm" != "yes" ]; then
            log_info "Cleanup cancelled"
            exit 0
        fi
        
        log_info "Cleaning migration tracking..."
        
        # Clear migration history table
        curl -s -X POST $HASURA_ENDPOINT/v2/query \
            -H "X-Hasura-Admin-Secret: $HASURA_SECRET" \
            -H "Content-Type: application/json" \
            -d '{
                "type": "run_sql",
                "args": {
                    "source": "main_db",
                    "sql": "TRUNCATE TABLE IF EXISTS hdb_catalog.schema_migrations;"
                }
            }' > /dev/null
        
        log_info "Migration tracking cleared"
        
        # Mark the consolidated migration as applied
        log_info "Marking consolidated migration as applied..."
        
        curl -s -X POST $HASURA_ENDPOINT/v2/query \
            -H "X-Hasura-Admin-Secret: $HASURA_SECRET" \
            -H "Content-Type: application/json" \
            -d '{
                "type": "run_sql",
                "args": {
                    "source": "main_db",
                    "sql": "INSERT INTO hdb_catalog.schema_migrations (version, dirty) VALUES (1000000000000, false) ON CONFLICT DO NOTHING;"
                }
            }' > /dev/null
        
        log_info "Consolidated migration marked as applied"
        ;;
        
    reload)
        log_info "Reloading Hasura metadata..."
        
        # Reload metadata
        curl -s -X POST $HASURA_ENDPOINT/v1/metadata \
            -H "X-Hasura-Admin-Secret: $HASURA_SECRET" \
            -H "Content-Type: application/json" \
            -d '{"type": "reload_metadata", "args": {}}' > /dev/null
        
        log_info "Metadata reloaded"
        
        # Track all tables
        log_info "Tracking tables..."
        
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
                }" 2>/dev/null > /dev/null && echo "  ✓ Tracked: $table" || echo "  - Already tracked: $table"
        done
        
        # Track view
        log_info "Tracking views..."
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
            }' 2>/dev/null > /dev/null && echo "  ✓ Tracked: practice_statistics_view" || echo "  - Already tracked: practice_statistics_view"
        
        log_info "Metadata reload complete"
        ;;
        
    export)
        log_info "Exporting current metadata..."
        
        $HASURA_CMD metadata export \
            --endpoint $HASURA_ENDPOINT \
            --admin-secret $HASURA_SECRET \
            --skip-update-check
        
        log_info "Metadata exported to schema/metadata/"
        ;;
        
    *)
        echo "Usage: $0 [status|clean|reload|export]"
        echo ""
        echo "Commands:"
        echo "  status  Check current migration tracking status"
        echo "  clean   Clean up legacy migration tracking"
        echo "  reload  Reload and track all tables/views"
        echo "  export  Export current metadata"
        echo ""
        echo "Environment variables:"
        echo "  HASURA_ENDPOINT      Hasura endpoint (default: http://localhost:28717)"
        echo "  HASURA_ADMIN_SECRET  Admin secret (default: hasura)"
        exit 1
        ;;
esac