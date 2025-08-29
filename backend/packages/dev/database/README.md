# Database Setup

## Quick Start

For fresh deployments, use the simplified migration script:

```bash
# Local development
./scripts/migrate-remote.sh local

# Staging environment  
./scripts/migrate-remote.sh staging

# Production (requires environment variables)
./scripts/migrate-remote.sh production
```

## Directory Structure

```
database/
├── schema/
│   └── migrations/
│       ├── kedge_db/
│       │   └── 1000000000000_initial_schema/  # Single consolidated migration
│       │       ├── up.sql                      # Creates complete schema
│       │       └── down.sql                    # Rollback script
│       └── archived_sequential_migrations/     # Old migrations (archived)
├── scripts/
│   ├── migrate-remote.sh                # Simple deployment script
│   ├── apply-consolidated-migration.sh  # Advanced migration management
│   ├── compare-schemas.sh              # Schema comparison tool
│   └── archive-old-migrations.sh       # Migration archival tool
└── README.md                           # This file
```

## Single Migration Approach

This database uses a **single consolidated migration** that creates the entire schema in one operation. This approach provides:

- ✅ **Fast deployment** (~100ms)
- ✅ **Simple management** (1 file instead of 17+)
- ✅ **Atomic operations** (all or nothing)
- ✅ **Clear schema definition**

## Migration Script Usage

### For Fresh Deployments (Recommended)

Use `migrate-remote.sh` for simple deployments:

```bash
# Deploy to local database
./scripts/migrate-remote.sh local

# Deploy to staging
STAGING_DB_HOST=10.64.0.40 \
STAGING_DB_NAME=staging_db \
STAGING_DB_USER=staging_user \
STAGING_DB_PASSWORD=password \
./scripts/migrate-remote.sh staging

# Deploy to production (with confirmation)
PROD_DB_HOST=prod.example.com \
PROD_DB_NAME=production_db \
PROD_DB_USER=prod_user \
PROD_DB_PASSWORD=secret \
./scripts/migrate-remote.sh production
```

### For Advanced Management

Use `apply-consolidated-migration.sh` for more control:

```bash
# Apply migration
./scripts/apply-consolidated-migration.sh apply

# Force apply (drops existing schema)
./scripts/apply-consolidated-migration.sh apply force

# Rollback
./scripts/apply-consolidated-migration.sh rollback

# Verify schema
./scripts/apply-consolidated-migration.sh verify
```

## Database Schema

The migration creates:

### Tables (10)
- `users` - User authentication and profiles
- `knowledge_points` - Curriculum hierarchy  
- `quizzes` - Quiz questions and metadata
- `practice_sessions` - Practice session tracking
- `practice_answers` - Individual answers
- `practice_strategies` - Learning strategies
- `student_weaknesses` - Performance tracking
- `student_mistakes` - Error analysis
- `knowledge_points_metadata` - System configuration
- `attachments` - File storage metadata

### Additional Objects
- 35+ performance indexes
- 10 auto-update triggers
- 1 analytics view
- Default data (anonymous user, strategies)

## Environment Configuration

### Local Development
Default configuration (no setup needed):
- Host: localhost
- Port: 7543
- Database: kedge_db
- User: postgres
- Password: postgres

### Remote Deployment
Set environment variables for your target:

```bash
# Staging
export STAGING_DB_HOST=your-staging-host
export STAGING_DB_PORT=5432
export STAGING_DB_NAME=your-db-name
export STAGING_DB_USER=your-user
export STAGING_DB_PASSWORD=your-password

# Production
export PROD_DB_HOST=your-prod-host
export PROD_DB_PORT=5432
export PROD_DB_NAME=your-db-name
export PROD_DB_USER=your-user
export PROD_DB_PASSWORD=your-password
```

## Docker Integration

### Environment Setup
**IMPORTANT**: Before running Docker Compose, you must set required environment variables to avoid exposing credentials:

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and set your secure values:
# - HASURA_GRAPHQL_DATABASE_URL (PostgreSQL connection string)
# - HASURA_GRAPHQL_ADMIN_SECRET (Generate with: openssl rand -hex 32)
```

### Using Docker Compose
```bash
# Start database (requires .env file)
docker-compose up -d postgres

# Apply migration
docker exec -i dev-database_kedge-postgres-1 psql -U postgres -d kedge_db < schema/migrations/kedge_db/1000000000000_initial_schema/up.sql
```

### Direct Docker Command
```bash
# Run migration in Docker container
docker run --rm \
  -v $(pwd)/schema:/schema \
  postgres:15 \
  psql -h host.docker.internal -U postgres -d kedge_db \
  -f /schema/migrations/kedge_db/1000000000000_initial_schema/up.sql
```

## Troubleshooting

### Schema Already Exists
If the schema already exists, you have two options:

1. **Cancel and investigate** (recommended for production)
2. **Drop and recreate** (WARNING: Data loss!)

The `migrate-remote.sh` script will prompt you to choose.

### Connection Issues
Verify your connection parameters:
```bash
# Test connection
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1"
```

### Permission Errors
Ensure the database user has proper permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE kedge_db TO your_user;
```

## Archived Migrations

The old sequential migrations (17 files) have been archived to:
```
schema/migrations/archived_sequential_migrations/
```

These are kept for reference but are no longer needed for deployment.

To restore them (not recommended):
```bash
./scripts/archive-old-migrations.sh restore
```

## Best Practices

1. **Always backup** before applying migrations to production
2. **Test on staging** first
3. **Use version control** for all changes
4. **Document** any manual changes
5. **Monitor** after deployment

## Support

For issues or questions:
1. Check error messages in PostgreSQL logs
2. Verify environment variables are set correctly
3. Ensure database connectivity
4. Review the migration file for syntax errors

## License

This database schema is part of the Kedge Self-Practice platform.
