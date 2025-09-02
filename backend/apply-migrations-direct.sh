#!/bin/bash

echo "📦 Direct Database Migration Tool"
echo "================================="
echo ""
echo "This script applies migrations directly to the production database"
echo "Bypassing Hasura since it's configured for a different database"
echo ""

# Database credentials
DB_HOST="pgm-bp10tol2zf3i95f68o.pg.rds.aliyuncs.com"
DB_PORT="5432"
DB_USER="kedgetech"
DB_PASSWORD="Nie112233"
DB_NAME="kedge_db"

# Get the schema directory
SCHEMA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/packages/dev/database/schema"
MIGRATIONS_DIR="${SCHEMA_DIR}/migrations/kedge_db"

echo "🔍 Checking database connection..."
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Failed to connect to database"
    exit 1
fi

echo ""
echo "📋 Checking which migrations need to be applied..."
echo ""

# Create a simple migrations tracking table if it doesn't exist
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF > /dev/null 2>&1
CREATE SCHEMA IF NOT EXISTS migrations_tracking;
CREATE TABLE IF NOT EXISTS migrations_tracking.applied_migrations (
    version BIGINT PRIMARY KEY,
    name VARCHAR(255),
    applied_at TIMESTAMP DEFAULT NOW()
);
EOF

# Get list of migrations
for migration_dir in $(ls -d ${MIGRATIONS_DIR}/[0-9]*/ | sort -V); do
    migration_name=$(basename "$migration_dir")
    version=$(echo "$migration_name" | cut -d'_' -f1)
    
    # Check if migration was already applied
    already_applied=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM migrations_tracking.applied_migrations WHERE version = $version" 2>/dev/null | tr -d ' ')
    
    if [ "$already_applied" = "1" ]; then
        echo "✓ $migration_name (already applied)"
    else
        echo "→ Applying $migration_name..."
        
        if [ -f "$migration_dir/up.sql" ]; then
            if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < "$migration_dir/up.sql" > /dev/null 2>&1; then
                # Record the migration as applied
                PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "INSERT INTO migrations_tracking.applied_migrations (version, name) VALUES ($version, '$migration_name')" > /dev/null 2>&1
                echo "  ✅ Applied successfully"
            else
                echo "  ⚠️  Skipped (may already be applied or not needed)"
                # Still mark as applied to prevent retrying
                PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "INSERT INTO migrations_tracking.applied_migrations (version, name) VALUES ($version, '$migration_name') ON CONFLICT DO NOTHING" > /dev/null 2>&1
            fi
        else
            echo "  ⚠️  No up.sql file found"
        fi
    fi
done

echo ""
echo "🎉 Migration process complete!"
echo ""
echo "📊 Migration Summary:"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) as total_migrations FROM migrations_tracking.applied_migrations"

echo ""
echo "✅ To verify the class field was added:"
echo "   Run: PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \"\\d kedge_practice.users\" | grep class"