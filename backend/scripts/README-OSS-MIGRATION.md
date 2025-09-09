# OSS Attachment Migration Script

This script migrates quiz attachments from local filesystem storage to Aliyun Object Storage Service (OSS).

## Features

- **Duplicate Detection**: Checks if files already exist in OSS before uploading
- **Parallel Uploads**: Configurable parallel upload threads for faster migration
- **Progress Tracking**: Real-time progress display with statistics
- **Dry Run Mode**: Test migration without actually uploading files
- **Verification Mode**: Verify all files exist in OSS after migration
- **Error Handling**: Graceful error handling with detailed error reporting
- **Resume Support**: Skip already uploaded files on subsequent runs
- **File Filtering**: Automatically skips hidden files (starting with .) and .emf files

## Prerequisites

1. **Aliyun OSS Account**: You need an Aliyun account with OSS service enabled
2. **OSS Bucket**: Create a bucket in your desired region
3. **Access Keys**: Generate AccessKeyId and AccessKeySecret from Aliyun console

## Configuration

Set the following environment variables in `backend/.envrc` or `backend/.envrc.override`:

```bash
# Required OSS Configuration
export ALIYUN_OSS_ACCESS_KEY_ID="your-access-key-id"
export ALIYUN_OSS_ACCESS_KEY_SECRET="your-access-key-secret"
export ALIYUN_OSS_BUCKET="your-bucket-name"
export ALIYUN_OSS_REGION="oss-cn-hangzhou"  # Your OSS region

# Optional Configuration
export ALIYUN_OSS_ENDPOINT="oss-cn-hangzhou.aliyuncs.com"  # Custom endpoint
export ALIYUN_OSS_PATH_PREFIX="quiz-attachments"  # Path prefix in bucket
export QUIZ_STORAGE_PATH="./quiz-storage"  # Local storage path
```

## Usage

### Using npm scripts (recommended)

```bash
# Navigate to backend directory
cd backend

# Dry run - see what would be uploaded
npm run migrate:oss:dry-run

# Perform actual migration
npm run migrate:oss

# Verify all files exist in OSS
npm run migrate:oss:verify

# Show help
npm run migrate:oss:help
```

### Direct script execution

```bash
# Navigate to backend directory
cd backend

# Make script executable (first time only)
chmod +x scripts/migrate-attachments-to-oss.js

# Run migration
node scripts/migrate-attachments-to-oss.js [options]
```

## Command Line Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Simulate migration without uploading files |
| `--verbose` | Show detailed progress for each file |
| `--force` | Skip duplicate check and re-upload all files |
| `--parallel=N` | Number of parallel uploads (default: 3, max: 10) |
| `--verify` | Verify that all files exist in OSS |
| `--help` | Show help message |

## Examples

### 1. Test Migration (Dry Run)

```bash
npm run migrate:oss:dry-run
```

Output:
```
🚀 Starting attachment migration to OSS...
📁 Local storage: /path/to/quiz-storage
☁️  OSS bucket: your-bucket
🔍 DRY RUN MODE - No files will be uploaded

🔍 Scanning local files...
📊 Found 150 files (245.3 MB)

🔍 [DRY RUN] Would upload: 2025/01/image1.png -> quiz-attachments/2025/01/image1.png
🔍 [DRY RUN] Would upload: 2025/01/image2.jpg -> quiz-attachments/2025/01/image2.jpg
...
```

### 2. Perform Migration

```bash
npm run migrate:oss
```

Output:
```
🚀 Starting attachment migration to OSS...
✅ Connected to OSS bucket: your-bucket

📊 Found 150 files (245.3 MB)

📊 Progress: 50/150 (33%)
✅ Uploaded: 2025/01/image1.png (125.4 KB)
⏭️  Skipped (exists): 2025/01/image2.jpg
...

══════════════════════════════════════════════════
📊 Migration Summary
══════════════════════════════════════════════════
Total files:     150
Total size:      245.3 MB
✅ Uploaded:     120 files
⏭️  Skipped:      30 files (already exist)
❌ Failed:       0 files
⏱️  Duration:     45.2 seconds
📈 Upload speed: 5.4 MB/s
══════════════════════════════════════════════════
```

### 3. Verify Migration

```bash
npm run migrate:oss:verify
```

Output:
```
🔍 Verifying migration...
📁 Local storage: /path/to/quiz-storage
☁️  OSS bucket: your-bucket

🔍 Checking: 150/150

══════════════════════════════════════════════════
📊 Verification Results
══════════════════════════════════════════════════
Total files:      150
✅ In OSS:        150 files
❌ Missing:       0 files
══════════════════════════════════════════════════
✅ All files successfully exist in OSS!
```

### 4. Force Re-upload

```bash
node scripts/migrate-attachments-to-oss.js --force --parallel=5
```

### 5. Verbose Mode

```bash
node scripts/migrate-attachments-to-oss.js --verbose
```

## Migration Process

1. **Scanning**: The script scans the local storage directory recursively
2. **Duplicate Check**: For each file, it checks if it already exists in OSS
3. **Upload**: Files are uploaded in parallel batches
4. **Progress**: Real-time progress is displayed
5. **Summary**: Final statistics are shown

## File Organization in OSS

Files are organized in OSS with the following structure:
```
bucket-name/
└── quiz-attachments/          # Path prefix
    ├── 2024/
    │   ├── 01/
    │   │   ├── uuid1.png
    │   │   └── uuid2.jpg
    │   └── 02/
    │       └── uuid3.pdf
    └── 2025/
        └── 01/
            └── uuid4.png
```

## Skipped Files

The script automatically skips the following files:
- **Hidden files**: Files starting with `.` (e.g., `.DS_Store`, `.gitignore`)
- **EMF files**: Enhanced Metafile format files (`.emf`) - these should be converted to PNG during initial upload
- **WMF files**: Windows Metafile format files (`.wmf`) - these should be converted to PNG during initial upload
- **System files**: Other system-generated files that start with `.`

Note: EMF/WMF files found in storage indicate failed conversions and should not be migrated to OSS.

## Error Handling

- **Network Errors**: The script will retry failed uploads
- **Access Denied**: Check your access keys and bucket permissions
- **File Not Found**: Verify the local storage path exists
- **Bucket Not Found**: Ensure the bucket name is correct

## Performance Tips

1. **Parallel Uploads**: Increase `--parallel` for faster uploads (default: 3)
   ```bash
   node scripts/migrate-attachments-to-oss.js --parallel=10
   ```

2. **Internal Endpoint**: If running from Aliyun ECS, use internal endpoint for faster speeds:
   ```bash
   export ALIYUN_OSS_INTERNAL_ENDPOINT="oss-cn-hangzhou-internal.aliyuncs.com"
   ```

3. **Large Files**: For very large files, consider using OSS multipart upload (not implemented in this script)

## Troubleshooting

### "OSS configuration missing"
- Ensure all required environment variables are set in `.envrc`
- Source the environment file: `source .envrc`

### "Local storage path not found"
- Check `QUIZ_STORAGE_PATH` points to the correct directory
- Use absolute path if relative path doesn't work

### "Access denied" errors
- Verify your AccessKeyId and AccessKeySecret are correct
- Check the IAM user has sufficient permissions for the bucket

### Files not accessible after migration
- Check the application's OSS configuration matches the migration settings
- Verify the `ALIYUN_OSS_PATH_PREFIX` is consistent

## Rollback

If you need to rollback the migration:

1. The local files are not deleted, they remain in the filesystem
2. You can disable OSS in the application by clearing the OSS environment variables
3. The application will automatically fall back to filesystem storage

## Security Considerations

1. **Access Keys**: Never commit access keys to version control
2. **Bucket Permissions**: Use private ACL for sensitive files
3. **HTTPS**: The script uses HTTPS by default for secure transfers
4. **File Validation**: The script validates file paths to prevent directory traversal

## Next Steps After Migration

1. **Update Application Config**: Ensure the application has the same OSS configuration
2. **Test Access**: Verify the application can access files from OSS
3. **Monitor Usage**: Check OSS console for usage statistics
4. **Set Lifecycle Rules**: Configure lifecycle rules in OSS for cost optimization
5. **Enable CDN**: Consider using Aliyun CDN for better performance

## Support

For issues or questions:
1. Check the error messages and logs
2. Verify configuration with `--dry-run` first
3. Use `--verbose` for detailed debugging information
4. Check Aliyun OSS documentation for service-specific issues