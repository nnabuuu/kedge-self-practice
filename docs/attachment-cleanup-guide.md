# Attachment Cleanup Guide

## Overview

This guide explains how to manage and clean up attachment files (images) stored on your servers. Since you've reset the database but still have orphaned image files on the remote server, this guide will help you clean them up.

## Current Situation

- **Database**: Fresh and clean (no quiz records)
- **Remote Server**: Contains orphaned image files from previous data
- **Storage Path**: Files stored in year/month directory structure (e.g., `/2025/08/uuid.png`)
- **Access URLs**: Both old and new formats work
  - Old: `/v1/attachments/quiz/2025/08/uuid.png`
  - New: `/v1/attachments/uuid.png`

## Cleanup Scripts

### 1. Local Attachment Management (`clean-attachments.sh`)

For managing attachments on your local development environment:

```bash
# Scan local attachments
./scripts/clean-attachments.sh scan

# Find orphaned attachments (not in database)
./scripts/clean-attachments.sh orphaned

# Clean orphaned attachments
./scripts/clean-attachments.sh clean

# Backup before cleaning
./scripts/clean-attachments.sh backup ./my-backup

# Nuclear option - delete ALL attachments
./scripts/clean-attachments.sh clean-all
```

### 2. Remote Attachment Management (`clean-remote-attachments.sh`)

For managing attachments on production/staging servers:

```bash
# Test connection to remote server
./scripts/clean-remote-attachments.sh test

# Scan remote attachments
./scripts/clean-remote-attachments.sh scan

# Backup remote attachments locally
./scripts/clean-remote-attachments.sh backup ./remote-backup

# Interactive menu
./scripts/clean-remote-attachments.sh
```

## Cleaning Remote Server Attachments

Since your database is now empty but the remote server still has image files, you have several options:

### Option 1: Complete Cleanup (Recommended for Fresh Start)

If you want a completely fresh start with no old attachments:

1. **SSH into the remote server**:
```bash
ssh your-user@35.213.100.193
```

2. **Navigate to storage directory**:
```bash
cd /var/quiz-storage  # Or wherever attachments are stored
```

3. **Delete all old attachments**:
```bash
# BE CAREFUL - This deletes everything!
rm -rf 2025/ 2024/  # Remove year directories

# Or more safely, move to backup first
mkdir -p /tmp/old-attachments-backup
mv 2025/ 2024/ /tmp/old-attachments-backup/
```

### Option 2: Selective Cleanup

If you want to keep some attachments for future use:

1. **First, backup important files**:
```bash
# From your local machine
./scripts/clean-remote-attachments.sh backup ./important-attachments
```

2. **Then clean the server**:
```bash
# On the remote server
find /var/quiz-storage -type f -name "*.png" -mtime +30 -delete  # Delete files older than 30 days
```

### Option 3: Automated Cleanup Script

Run this script on the remote server to clean orphaned attachments:

```bash
#!/bin/bash
# save as cleanup-orphaned.sh on remote server

STORAGE_PATH="/var/quiz-storage"
DB_NAME="arthur-test"
DB_USER="arthur"
PGPASSWORD="arthur"

# Since database is empty, all files are orphaned
echo "Finding all attachment files..."
find $STORAGE_PATH -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) | while read file; do
    echo "Deleting: $file"
    rm "$file"
done

# Clean empty directories
find $STORAGE_PATH -type d -empty -delete

echo "Cleanup complete!"
```

## Preventing Future Orphaned Files

### 1. Regular Cleanup Cron Job

Add to crontab on the server:
```bash
# Run cleanup weekly on Sunday at 2 AM
0 2 * * 0 /path/to/cleanup-orphaned.sh
```

### 2. Attachment Lifecycle Management

Implement in your application:
- Track all uploads in the `attachments` table
- Delete files when quiz is deleted
- Regular audit of orphaned files

### 3. Storage Limits

Set up monitoring:
```bash
# Check storage usage
df -h /var/quiz-storage

# Alert if usage exceeds 80%
if [ $(df /var/quiz-storage | awk 'NR==2 {print int($5)}') -gt 80 ]; then
    echo "Storage usage high!" | mail -s "Attachment Storage Alert" admin@example.com
fi
```

## Best Practices

### Before Cleanup

1. **Always backup first**:
```bash
./scripts/clean-remote-attachments.sh backup ./backup-$(date +%Y%m%d)
```

2. **Verify database state**:
```sql
-- Check if any quizzes reference images
SELECT COUNT(*) FROM kedge_practice.quizzes WHERE images IS NOT NULL;
```

3. **Test in staging first**:
- Run cleanup on staging environment
- Verify application still works
- Then apply to production

### During Cleanup

1. **Log all deletions**:
```bash
# Create deletion log
LOGFILE="/var/log/attachment-cleanup-$(date +%Y%m%d).log"
find /var/quiz-storage -name "*.png" -delete -print >> $LOGFILE
```

2. **Monitor disk space**:
```bash
# Watch disk space during cleanup
watch -n 1 'df -h /var/quiz-storage'
```

### After Cleanup

1. **Verify application**:
- Test quiz creation with images
- Check existing quizzes still display
- Monitor error logs

2. **Update documentation**:
- Record cleanup date
- Note number of files removed
- Update storage estimates

## Storage Estimates

Based on typical usage:
- Average image size: 50-100 KB
- Images per quiz: 1-3
- Storage per 1000 quizzes: ~150 MB

Plan storage accordingly:
- Development: 1 GB
- Staging: 5 GB
- Production: 20+ GB

## Troubleshooting

### Issue: Can't delete files
```bash
# Check permissions
ls -la /var/quiz-storage

# Fix permissions if needed
sudo chown -R www-data:www-data /var/quiz-storage
```

### Issue: Application can't find images after cleanup
```bash
# Check if cleanup was too aggressive
# Restore from backup
cp -r /tmp/old-attachments-backup/* /var/quiz-storage/
```

### Issue: Disk full despite cleanup
```bash
# Check for other large files
du -h /var/quiz-storage | sort -rh | head -20

# Check if deleted files are still open
lsof | grep deleted
```

## Summary

For your current situation with a fresh database and orphaned remote files:

1. **Backup any files you might want** (if any):
   ```bash
   ./scripts/clean-remote-attachments.sh backup ./final-backup
   ```

2. **SSH to remote server and clean everything**:
   ```bash
   ssh user@35.213.100.193
   rm -rf /var/quiz-storage/2025 /var/quiz-storage/2024
   ```

3. **Start fresh with new attachment system**:
   - New uploads will use the simplified URL structure
   - Database will track all attachments properly
   - Regular cleanup scripts will prevent future orphans

This gives you a completely clean slate for both database and file storage!