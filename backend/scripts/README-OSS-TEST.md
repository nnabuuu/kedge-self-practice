# OSS Configuration Test Script

This script verifies that your Aliyun OSS (Object Storage Service) is properly configured for the application.

## What it Tests

1. **Environment Variables** - Checks all required and optional OSS configuration
2. **Connection** - Verifies connection to Aliyun OSS service
3. **Bucket Access** - Confirms access to your specified bucket
4. **File Operations** - Tests upload, download, and delete operations
5. **File Listing** - Lists existing files in your bucket

## Prerequisites

Before running this test, you need to:

1. **Create an Aliyun Account** (if you don't have one)
   - Sign up at: https://www.aliyun.com

2. **Enable OSS Service**
   - Go to: https://oss.console.aliyun.com
   - Activate the service if not already active

3. **Create a Bucket**
   - Click "Create Bucket" in OSS console
   - Choose a unique name (e.g., `kedge-quiz-attachments`)
   - Select a region close to your users
   - Set ACL to "Private"

4. **Get Access Keys**
   - Go to: https://ram.console.aliyun.com/manage/ak
   - Create new AccessKey pair
   - Save both AccessKeyId and AccessKeySecret securely

## Configuration

1. **Copy the example configuration**:
   ```bash
   cp backend/.envrc.oss.example backend/.envrc.override
   ```

2. **Edit `.envrc.override`** and add your OSS credentials:
   ```bash
   # Required settings
   export ALIYUN_OSS_ACCESS_KEY_ID="your-access-key-id"
   export ALIYUN_OSS_ACCESS_KEY_SECRET="your-access-key-secret"
   export ALIYUN_OSS_BUCKET="your-bucket-name"
   export ALIYUN_OSS_REGION="oss-cn-hangzhou"  # Your region
   ```

3. **Load the environment** (if using direnv):
   ```bash
   direnv allow
   ```

## Usage

### Run the test:
```bash
cd backend
npm run test:oss
```

### With verbose output:
```bash
node scripts/test-oss-config.js --verbose
```

### Show help:
```bash
node scripts/test-oss-config.js --help
```

## Expected Output

When properly configured, you should see:

```
✅ OSS Configuration Test Complete!
Your OSS is properly configured and ready to use.
```

## Common Issues

### "Missing required environment variables"
- Make sure you've added the OSS configuration to `.envrc.override`
- If using direnv, run `direnv allow` to load the variables
- Manually source the file: `source .envrc.override`

### "AccessDenied" error
- Check your AccessKeyId and AccessKeySecret are correct
- Verify the IAM user has OSS permissions
- Ensure the bucket name matches exactly

### "NoSuchBucket" error
- The bucket doesn't exist or the name is wrong
- Create the bucket in OSS console first
- Check for typos in ALIYUN_OSS_BUCKET

### "Connection timeout"
- Check your internet connection
- Verify the region is correct
- Try using a different endpoint

## OSS Regions

Common regions and their codes:

| Region | Code | Endpoint |
|--------|------|----------|
| China (Hangzhou) | oss-cn-hangzhou | oss-cn-hangzhou.aliyuncs.com |
| China (Shanghai) | oss-cn-shanghai | oss-cn-shanghai.aliyuncs.com |
| China (Beijing) | oss-cn-beijing | oss-cn-beijing.aliyuncs.com |
| China (Shenzhen) | oss-cn-shenzhen | oss-cn-shenzhen.aliyuncs.com |
| China (Hong Kong) | oss-cn-hongkong | oss-cn-hongkong.aliyuncs.com |
| Singapore | oss-ap-southeast-1 | oss-ap-southeast-1.aliyuncs.com |
| US (Silicon Valley) | oss-us-west-1 | oss-us-west-1.aliyuncs.com |

Full list: https://help.aliyun.com/document_detail/31837.html

## Security Notes

1. **Never commit credentials** to version control
2. `.envrc.override` is gitignored for safety
3. Use IAM users with minimal required permissions
4. Rotate access keys regularly
5. Consider using STS tokens for production

## Next Steps

Once the test passes:

1. **Migrate existing files** (if any):
   ```bash
   npm run migrate:oss
   ```

2. **Verify migration**:
   ```bash
   npm run migrate:oss:verify
   ```

3. **Update application** to use OSS for new uploads

## Troubleshooting

Enable verbose mode for detailed error information:
```bash
node scripts/test-oss-config.js --verbose
```

Check the Aliyun OSS console for:
- Bucket settings and permissions
- Access logs for debugging
- Usage statistics

## Support

For OSS-specific issues:
- Aliyun Documentation: https://help.aliyun.com/product/31815.html
- OSS SDK for Node.js: https://github.com/ali-sdk/ali-oss

For application issues:
- Check `backend/scripts/README-OSS-MIGRATION.md` for migration details
- Review the application logs for errors