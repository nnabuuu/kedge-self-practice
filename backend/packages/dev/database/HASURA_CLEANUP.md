# Hasura Metadata Cleanup Guide

## Overview

Since we've consolidated the database migrations into a single file, you should also clean up Hasura's metadata to ensure a clean deployment environment.

## What to Clean

### 1. Migration Tracking (Optional)
Hasura tracks which migrations have been applied in the `hdb_catalog.schema_migrations` table. For fresh deployments, this should only contain one entry:

```sql
version | dirty
--------|-------
1000000000000 | false
```

### 2. Metadata Files (Keep)
The metadata files in `schema/metadata/` should be kept as they define:
- Table tracking
- Relationships
- Permissions
- GraphQL customizations

These are separate from migrations and are still needed.

## Cleanup Steps

### Option 1: Light Cleanup (Recommended)

Keep existing metadata but clean migration tracking:

```bash
# Check current status
./scripts/clean-hasura-metadata.sh status

# Clean migration tracking
./scripts/clean-hasura-metadata.sh clean

# Reload metadata
./scripts/clean-hasura-metadata.sh reload
```

### Option 2: Fresh Start

For a completely fresh Hasura setup:

1. **Clear all metadata**:
```bash
# Remove old metadata
rm -rf schema/metadata/databases/main_db/tables/*

# Keep only the tables.yaml file
echo "[]" > schema/metadata/databases/main_db/tables/tables.yaml
```

2. **Apply fresh migration**:
```bash
./scripts/migrate-remote.sh local
```

3. **Track all tables in Hasura**:
```bash
./scripts/clean-hasura-metadata.sh reload
```

4. **Export new metadata**:
```bash
./scripts/clean-hasura-metadata.sh export
```

## What to Keep

### Essential Files
- `schema/metadata/databases/databases.yaml` - Database connection config
- `schema/metadata/version.yaml` - Hasura version
- `schema/metadata/actions.yaml` - Custom actions (if any)

### What Can Be Deleted
- Old migration references in metadata
- Unused table tracking
- Legacy relationships that no longer exist

## Verification

After cleanup, verify everything works:

```bash
# Check database schema
./scripts/apply-consolidated-migration.sh verify

# Check Hasura console
open http://localhost:28717/console

# Test GraphQL endpoint
curl -X POST http://localhost:28717/v1/graphql \
  -H "X-Hasura-Admin-Secret: hasura" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}'
```

## For Production

When deploying to production:

1. **Backup existing metadata**:
```bash
hasura metadata export --endpoint https://prod-hasura.example.com
```

2. **Apply consolidated migration**:
```bash
./scripts/migrate-remote.sh production
```

3. **Clean and reload metadata**:
```bash
HASURA_ENDPOINT=https://prod-hasura.example.com \
HASURA_ADMIN_SECRET=your-secret \
./scripts/clean-hasura-metadata.sh clean

HASURA_ENDPOINT=https://prod-hasura.example.com \
HASURA_ADMIN_SECRET=your-secret \
./scripts/clean-hasura-metadata.sh reload
```

## Benefits of Cleanup

- **Simpler deployment** - No confusion about which migrations to run
- **Faster startup** - Hasura doesn't check 17+ migrations
- **Cleaner metadata** - Only tracks what actually exists
- **Better debugging** - Easier to understand the current state

## Important Notes

1. **Metadata ≠ Migrations**: Hasura metadata (table tracking, permissions) is separate from database migrations
2. **Keep metadata backups**: Always export metadata before major changes
3. **Test locally first**: Run cleanup on local/staging before production
4. **Version control**: Commit metadata changes to git

## Summary

For most cases, you just need to:

```bash
# Clean migration tracking
./scripts/clean-hasura-metadata.sh clean

# Reload tables
./scripts/clean-hasura-metadata.sh reload

# You're done!
```

This ensures Hasura knows about the consolidated migration and tracks all tables correctly.