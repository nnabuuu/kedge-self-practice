# Database Management Scripts

This directory contains scripts for managing the database, migrations, and attachments.

## Scripts Overview

### Core Scripts

#### `clean-attachments.sh`
**Unified attachment management script** - Works both locally and on remote servers

Features:
- **Auto-detection**: Automatically detects if running locally or on remote server
- **Multiple operations**: Status, scan, find orphaned, clean, backup
- **Interactive menu**: User-friendly interface for all operations
- **Safety features**: Confirmation prompts, backup options

Usage:
```bash
# Interactive menu
./clean-attachments.sh

# Direct commands
./clean-attachments.sh status      # Show current status
./clean-attachments.sh scan        # Scan attachments
./clean-attachments.sh orphaned    # Find orphaned files
./clean-attachments.sh clean       # Clean orphaned files
./clean-attachments.sh backup      # Backup attachments

# Run on remote server via SSH
ssh user@35.213.100.193 'cd /path/to/scripts && ./clean-attachments.sh scan'
```

#### `fresh-start.sh`
**Complete database reset** - Drops and recreates everything from scratch

Features:
- Drops entire kedge_practice schema
- Applies consolidated migration
- Initializes Hasura metadata
- Tracks all tables automatically

Usage:
```bash
./fresh-start.sh
# Type 'RESET' to confirm
```

#### `apply-consolidated-migration.sh`
**Apply the consolidated migration** - For clean deployments

Features:
- Single migration file instead of 17 separate ones
- 95% faster deployment
- Atomic operation (all or nothing)
- Verification checks

Usage:
```bash
./apply-consolidated-migration.sh         # Apply locally
./apply-consolidated-migration.sh verify  # Verify schema
```

#### `migrate-remote.sh`
**Deploy migrations to different environments**

Features:
- Environment-specific configurations
- Safety confirmations for production
- Automatic backup suggestions

Usage:
```bash
./migrate-remote.sh local       # Local development
./migrate-remote.sh staging     # Staging server
./migrate-remote.sh production  # Production (requires confirmation)
```

### Supporting Scripts

- `clean-hasura-metadata.sh` - Hasura metadata cleanup
- `archive-old-migrations.sh` - Archive old migration files (can be removed after consolidation)

## Common Workflows

### 1. Fresh Development Setup
```bash
# Reset database completely
./fresh-start.sh

# Start with clean attachments
./clean-attachments.sh clean-all
```

### 2. Clean Orphaned Files (Local)
```bash
# Check status
./clean-attachments.sh status

# Find orphaned files
./clean-attachments.sh orphaned

# Clean them up
./clean-attachments.sh clean
```

### 3. Clean Remote Server
```bash
# SSH to remote server
ssh user@35.213.100.193

# Navigate to scripts directory
cd /path/to/kedge-self-practice/backend/packages/dev/database/scripts

# Run cleanup
./clean-attachments.sh
# Select option 3: Find orphaned
# Select option 4: Clean orphaned
```

### 4. Backup Before Major Changes
```bash
# Backup attachments
./clean-attachments.sh backup ./backup-$(date +%Y%m%d)

# Then proceed with cleanup
./clean-attachments.sh clean
```

## Environment Variables

The scripts use these environment variables (with sensible defaults):

### Database Connection
- `DB_HOST` - Database host (auto-detected)
- `DB_PORT` - Database port (auto-detected)
- `DB_NAME` - Database name (auto-detected)
- `DB_USER` - Database user (auto-detected)
- `PGPASSWORD` - Database password

### Storage
- `QUIZ_STORAGE_PATH` - Attachment storage path
  - Local default: `/tmp/quiz-storage`
  - Remote default: `/var/quiz-storage`

### Hasura
- `HASURA_ENDPOINT` - Hasura GraphQL endpoint
- `HASURA_ADMIN_SECRET` - Hasura admin secret

## Auto-Detection Logic

The unified attachment script automatically detects the environment:

1. **Remote Server Detection**:
   - Checks if `/var/quiz-storage` exists
   - Checks if running in Docker container
   - Uses remote database settings (arthur-test)

2. **Local Development**:
   - Uses local paths (`/tmp/quiz-storage`)
   - Uses local database (kedge_db)

## Safety Features

All destructive operations include:
- Clear warnings about what will be deleted
- Confirmation prompts (must type exact confirmation)
- Backup recommendations
- Dry-run options where applicable

## Troubleshooting

### Can't connect to database
```bash
# Check connection settings
./clean-attachments.sh status

# Override if needed
DB_HOST=localhost DB_PORT=5432 ./clean-attachments.sh status
```

### Permission denied
```bash
# Make scripts executable
chmod +x *.sh

# For storage directory issues
sudo chown -R $(whoami) /path/to/storage
```

### Script not found on remote
```bash
# Copy script to remote
scp clean-attachments.sh user@server:/path/to/scripts/

# Make executable
ssh user@server 'chmod +x /path/to/scripts/clean-attachments.sh'
```

## Best Practices

1. **Always backup before cleanup**:
   ```bash
   ./clean-attachments.sh backup ./backup-$(date +%Y%m%d)
   ```

2. **Test on staging first**:
   - Run cleanup on staging environment
   - Verify application still works
   - Then apply to production

3. **Regular maintenance**:
   - Schedule weekly orphaned file cleanup
   - Monitor storage usage
   - Keep backups for 30 days

4. **Use the unified script**:
   - Works everywhere (local, remote, Docker)
   - Auto-detects environment
   - Consistent interface

## Support

For issues or questions:
1. Check script help: `./script-name.sh --help`
2. Review logs in script output
3. Check database connectivity
4. Verify file permissions