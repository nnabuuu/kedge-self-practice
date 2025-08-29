#!/bin/bash

# =================================================================
# REMOTE MIGRATION SCRIPT
# =================================================================
# Simple script for applying migrations to remote databases
# Designed for fresh deployments using the consolidated migration
# =================================================================

set -e  # Exit on error

# Parse command line arguments
ENV="${1:-local}"

# Load environment-specific configuration
case "$ENV" in
    local)
        DB_HOST="localhost"
        DB_PORT="7543"
        DB_NAME="kedge_db"
        DB_USER="postgres"
        DB_PASSWORD="postgres"
        ;;
    staging|stage)
        # Update these values for your staging environment
        DB_HOST="${STAGING_DB_HOST:-10.64.0.40}"
        DB_PORT="${STAGING_DB_PORT:-5432}"
        DB_NAME="${STAGING_DB_NAME:-arthur-test}"
        DB_USER="${STAGING_DB_USER:-arthur}"
        DB_PASSWORD="${STAGING_DB_PASSWORD:-arthur}"
        ;;
    production|prod)
        # Update these values for your production environment
        DB_HOST="${PROD_DB_HOST}"
        DB_PORT="${PROD_DB_PORT:-5432}"
        DB_NAME="${PROD_DB_NAME}"
        DB_USER="${PROD_DB_USER}"
        DB_PASSWORD="${PROD_DB_PASSWORD}"

        if [ -z "$PROD_DB_HOST" ]; then
            echo "Error: Production database credentials not set"
            echo "Please set PROD_DB_HOST, PROD_DB_NAME, PROD_DB_USER, PROD_DB_PASSWORD"
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 [local|staging|production]"
        echo ""
        echo "Applies the initial schema migration to the specified environment"
        echo ""
        echo "Environments:"
        echo "  local       - Local development database (default)"
        echo "  staging     - Staging environment"
        echo "  production  - Production environment (requires env vars)"
        echo ""
        echo "Environment variables for staging:"
        echo "  STAGING_DB_HOST, STAGING_DB_PORT, STAGING_DB_NAME"
        echo "  STAGING_DB_USER, STAGING_DB_PASSWORD"
        echo ""
        echo "Environment variables for production:"
        echo "  PROD_DB_HOST, PROD_DB_PORT, PROD_DB_NAME"
        echo "  PROD_DB_USER, PROD_DB_PASSWORD"
        exit 1
        ;;
esac

# Migration file path
MIGRATION_FILE="$(dirname "$0")/../schema/migrations/kedge_db/1000000000000_initial_schema/up.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Remote Migration Tool${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Environment: $ENV"
echo "Database:    $DB_NAME"
echo "Host:        $DB_HOST:$DB_PORT"
echo "User:        $DB_USER"
echo ""

# Confirm for production
if [ "$ENV" = "production" ] || [ "$ENV" = "prod" ]; then
    echo -e "${YELLOW}⚠️  WARNING: You are about to apply migrations to PRODUCTION${NC}"
    echo -e "${YELLOW}   This action cannot be easily undone.${NC}"
    echo ""
    read -p "Type 'DEPLOY' to confirm: " confirmation
    if [ "$confirmation" != "DEPLOY" ]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
fi

# Check if schema already exists
echo "Checking existing schema..."
SCHEMA_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT 1 FROM information_schema.schemata WHERE schema_name = 'kedge_practice'" 2>/dev/null || echo "0")

if [ "$SCHEMA_EXISTS" = "1" ]; then
    echo -e "${YELLOW}⚠️  Schema 'kedge_practice' already exists${NC}"
    echo ""
    echo "Options:"
    echo "1. Cancel deployment (recommended for production)"
    echo "2. Drop existing schema and recreate (WARNING: Data loss!)"
    echo ""
    read -p "Choose option [1-2]: " choice

    case $choice in
        2)
            echo -e "${YELLOW}Dropping existing schema...${NC}"
            PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "DROP SCHEMA IF EXISTS kedge_practice CASCADE;"
            echo "Schema dropped"
            ;;
        *)
            echo "Deployment cancelled"
            exit 0
            ;;
    esac
fi

# Apply migration
echo ""
echo "Applying migration..."
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Migration applied successfully!${NC}"
    echo ""

    # Verify tables
    echo "Verifying schema..."
    TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'kedge_practice'")
    INDEX_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'kedge_practice'")

    echo "Created:"
    echo "  • $TABLE_COUNT tables"
    echo "  • $INDEX_COUNT indexes"
    echo ""

    # List tables
    echo "Tables created:"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT '  • ' || table_name FROM information_schema.tables WHERE table_schema = 'kedge_practice' ORDER BY table_name"

    echo ""
    echo -e "${GREEN}Deployment complete!${NC}"
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ Migration failed!${NC}"
    echo "Please check the error messages above"
    exit 1
fi
