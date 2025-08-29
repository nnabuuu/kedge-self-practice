#!/bin/bash

# =================================================================
# ARCHIVE OLD MIGRATIONS SCRIPT
# =================================================================
# This script archives the old sequential migrations after
# verifying the consolidated migration works correctly.
# =================================================================

set -e

MIGRATION_DIR="$(dirname "$0")/../schema/migrations/kedge_db"
ARCHIVE_DIR="$(dirname "$0")/../schema/migrations/archived_sequential_migrations"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if consolidated migration exists
if [ ! -d "$MIGRATION_DIR/consolidated_initial_schema" ]; then
    log_error "Consolidated migration not found!"
    exit 1
fi

# Parse command
ACTION="${1:-list}"

case "$ACTION" in
    list)
        log_info "Migrations to be archived:"
        echo ""
        for dir in "$MIGRATION_DIR"/[0-9]*; do
            if [ -d "$dir" ]; then
                basename "$dir"
            fi
        done
        echo ""
        log_info "Total: $(ls -d "$MIGRATION_DIR"/[0-9]* 2>/dev/null | wc -l) migrations"
        log_info "Use '$0 archive' to archive these migrations"
        ;;

    archive)
        # Count migrations
        MIGRATION_COUNT=$(ls -d "$MIGRATION_DIR"/[0-9]* 2>/dev/null | wc -l)

        if [ "$MIGRATION_COUNT" -eq 0 ]; then
            log_info "No migrations to archive"
            exit 0
        fi

        log_info "Archiving $MIGRATION_COUNT migrations..."

        # Create archive directory
        mkdir -p "$ARCHIVE_DIR"

        # Create archive info file
        cat > "$ARCHIVE_DIR/archive_info.txt" << EOF
Archived on: $(date)
Number of migrations: $MIGRATION_COUNT
Reason: Replaced with consolidated_initial_schema migration

These migrations were the original sequential migrations that built
the schema incrementally. They have been replaced with a single
consolidated migration for better performance and maintainability.

To restore these migrations:
1. Move them back to the kedge_db directory
2. Remove the consolidated_initial_schema directory
3. Re-run migrations sequentially
EOF

        # Move migrations
        for dir in "$MIGRATION_DIR"/[0-9]*; do
            if [ -d "$dir" ]; then
                migration_name=$(basename "$dir")
                log_info "  Archiving: $migration_name"
                mv "$dir" "$ARCHIVE_DIR/"
            fi
        done

        log_info "Migrations archived to: $ARCHIVE_DIR"
        log_info "Archive info saved to: $ARCHIVE_DIR/archive_info.txt"
        ;;

    restore)
        if [ ! -d "$ARCHIVE_DIR" ]; then
            log_error "No archived migrations found"
            exit 1
        fi

        log_warn "This will restore the old sequential migrations."
        log_warn "The consolidated migration will be preserved."
        echo ""
        read -p "Are you sure? (yes/no): " confirm

        if [ "$confirm" != "yes" ]; then
            log_info "Restore cancelled"
            exit 0
        fi

        # Restore migrations
        for dir in "$ARCHIVE_DIR"/[0-9]*; do
            if [ -d "$dir" ]; then
                migration_name=$(basename "$dir")
                log_info "  Restoring: $migration_name"
                mv "$dir" "$MIGRATION_DIR/"
            fi
        done

        log_info "Migrations restored from archive"
        ;;

    *)
        echo "Usage: $0 [list|archive|restore]"
        echo ""
        echo "Commands:"
        echo "  list     List migrations that will be archived"
        echo "  archive  Archive old sequential migrations"
        echo "  restore  Restore archived migrations"
        exit 1
        ;;
esac
