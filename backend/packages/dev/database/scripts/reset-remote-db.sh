#!/bin/bash

# =================================================================
# REMOTE DATABASE RESET SCRIPT
# =================================================================
# This script completely resets the remote database schema
# WARNING: This will DELETE ALL DATA!
# =================================================================

set -e

# Configuration
DB_HOST="${DB_HOST:-34.84.100.187}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-arthur}"
DB_NAME="${DB_NAME:-arthur-test}"
DB_PASSWORD="${PGPASSWORD:-arthur}"

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

# Warning banner
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}  REMOTE DATABASE RESET${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${RED}⚠️  WARNING: This script will:${NC}"
echo -e "${RED}   • DROP the entire kedge_practice schema${NC}"
echo -e "${RED}   • DROP the Hasura catalog schema${NC}"
echo -e "${RED}   • DELETE ALL DATA${NC}"
echo ""
echo "Database: $DB_NAME @ $DB_HOST:$DB_PORT"
echo ""
read -p "Type 'RESET REMOTE' to confirm: " confirmation

if [ "$confirmation" != "RESET REMOTE" ]; then
    log_error "Reset cancelled"
    exit 1
fi

log_info "Connecting to remote database..."

# Drop schemas
log_info "Dropping kedge_practice schema..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "DROP SCHEMA IF EXISTS kedge_practice CASCADE;" || {
    log_error "Failed to drop kedge_practice schema"
    exit 1
}

log_info "Dropping hdb_catalog schema (Hasura metadata)..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "DROP SCHEMA IF EXISTS hdb_catalog CASCADE;" || {
    log_warn "Failed to drop hdb_catalog schema (might not exist)"
}

# Verify cleanup
log_info "Verifying cleanup..."
SCHEMA_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name IN ('kedge_practice', 'hdb_catalog')")

if [ "$SCHEMA_COUNT" = "0" ]; then
    log_info "✓ Database successfully reset!"
    echo ""
    echo -e "${GREEN}Database is now clean and ready for fresh migration.${NC}"
    echo ""
    echo "Next step: Run the migration"
    echo "  migrate-remote"
else
    log_error "Schemas still exist. Manual cleanup may be required."
    exit 1
fi