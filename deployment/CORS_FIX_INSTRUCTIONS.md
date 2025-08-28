# CORS Fix Deployment Instructions

## Problem
The DOCX upload feature was failing with CORS errors when uploading to the remote server (cyez.zhushou.one). The error occurred because nginx wasn't including CORS headers on error responses (like 401 Unauthorized).

## Solution
The nginx configuration needs to be updated to include CORS headers on ALL responses using the `always` flag.

## Deployment Steps

### Option 1: Automatic Script (Recommended)
1. SSH into your server:
   ```bash
   ssh your-server
   ```

2. Upload the deployment script:
   ```bash
   scp deployment/update-nginx-cors.sh your-server:/tmp/
   ```

3. Run the script:
   ```bash
   sudo /tmp/update-nginx-cors.sh
   ```

### Option 2: Manual Update
1. SSH into your server
2. Backup current config:
   ```bash
   sudo cp /etc/nginx/sites-available/cyez /etc/nginx/sites-available/cyez.backup
   ```

3. Edit the nginx configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/cyez
   ```

4. In the `/v1/` location block, add these CORS headers OUTSIDE the OPTIONS check:
   ```nginx
   # Add CORS headers to all responses (including errors)
   add_header 'Access-Control-Allow-Origin' '*' always;
   add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
   add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
   add_header 'Access-Control-Allow-Credentials' 'true' always;
   ```

5. Test and reload:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## What Changed
- **Before**: CORS headers only added for OPTIONS preflight requests
- **After**: CORS headers added to ALL responses with `always` flag

## Key Fix
The critical change is adding the `always` flag to ensure CORS headers are included even on error responses (401, 403, 500, etc.).

## Testing
After applying the fix:
1. Open https://cyez.zhushou.one/parser
2. Try uploading a DOCX file
3. The upload should work without CORS errors

## Rollback
If issues occur:
```bash
sudo cp /etc/nginx/sites-available/cyez.backup /etc/nginx/sites-available/cyez
sudo systemctl reload nginx
```

## Additional Notes
- The backend must also be running and properly configured at port 8718
- Ensure the latest backend code is deployed with DOCX processing endpoints
- The frontend is configured to use `https://cyez.zhushou.one/v1` as the API endpoint