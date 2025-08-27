# Deployment Guide for Kedge Self Practice Platform

This guide will help you deploy the complete Kedge platform (backend + 2 frontends) on a VM using nginx and PM2.

## Architecture Overview

```
your-domain.com
├── /              → frontend-practice (Student app)
├── /quiz-parser   → frontend-quiz-parser (Teacher tool)
└── /api           → backend API (NestJS)
```

## Prerequisites

- Ubuntu/Debian VM with at least 2GB RAM
- Node.js 18+ installed
- nginx installed
- PM2 installed globally (`npm install -g pm2`)
- PostgreSQL database (can use remote)
- Redis (optional, for caching)

## Step 1: Prepare the VM

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx git build-essential

# Install Node.js 18 (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Create directories
sudo mkdir -p /var/www/kedge-practice
sudo mkdir -p /var/www/kedge-quiz-parser
sudo mkdir -p /var/lib/kedge/quiz-storage
sudo mkdir -p /var/log/pm2

# Set permissions
sudo chown -R $USER:$USER /var/www/
sudo chown -R $USER:$USER /var/lib/kedge/
```

## Step 2: Build Locally

On your local machine:

```bash
# 1. Set environment variables for production
export BACKEND_URL="http://your-domain.com/api"  # Change to your domain
export QUIZ_PARSER_URL="/quiz-parser"

# 2. Build frontend-practice
cd frontend-practice
echo "VITE_API_BASE_URL=$BACKEND_URL" > .env.production
npm install
npm run build

# 3. Build frontend-quiz-parser with subdirectory base
cd ../frontend-quiz-parser
echo "VITE_API_BASE_URL=$BACKEND_URL" > .env.production
# Use the production config with base path
npx vite build --config vite.config.prod.ts

# 4. Build backend (optional, can build on server)
cd ../backend
npm install
nx build api-server
```

## Step 3: Upload to Server

```bash
# From your local machine
SERVER="ubuntu@your-server.com"  # Change to your server

# Upload frontend builds
scp -r frontend-practice/dist/* $SERVER:/var/www/kedge-practice/
scp -r frontend-quiz-parser/dist/* $SERVER:/var/www/kedge-quiz-parser/

# Upload backend (entire backend folder)
scp -r backend $SERVER:~/kedge-backend/

# Upload deployment configs
scp deployment/nginx-full-config.conf $SERVER:/tmp/
scp deployment/ecosystem.config.js $SERVER:~/
```

## Step 4: Configure Nginx

On the server:

```bash
# Copy nginx config
sudo cp /tmp/nginx-full-config.conf /etc/nginx/sites-available/kedge

# Edit the config to set your domain
sudo nano /etc/nginx/sites-available/kedge
# Replace "your-domain.com" with your actual domain

# Enable the site
sudo ln -sf /etc/nginx/sites-available/kedge /etc/nginx/sites-enabled/

# Remove default site if needed
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Step 5: Setup Backend with PM2

```bash
# Navigate to backend directory
cd ~/kedge-backend

# Install dependencies
npm install

# Create .env file for production
cat > .env <<EOF
NODE_ENV=production
API_PORT=8718
NODE_DATABASE_URL=postgres://your_db_user:your_db_password@your_db_host:5432/your_database
JWT_SECRET=$(openssl rand -base64 32)
REDIS_HOST=localhost
REDIS_PORT=6379
QUIZ_STORAGE_PATH=/var/lib/kedge/quiz-storage
CORS_ORIGIN=http://your-domain.com
EOF

# Start with PM2
pm2 start ~/ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions printed by this command
```

## Step 6: SSL Setup (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is set up automatically
sudo certbot renew --dry-run  # Test renewal
```

## Step 7: Configure Frontend URLs

### For frontend-practice:

The app needs to know where the quiz-parser is. You can either:

1. **Option A**: Set it at build time (recommended)
   ```bash
   # In .env.production
   VITE_QUIZ_PARSER_URL=/quiz-parser
   ```

2. **Option B**: Use relative URLs in the code
   - The practice app can link to `/quiz-parser` directly

### For frontend-quiz-parser:

Make sure it works under `/quiz-parser` path:
- Images and assets should use relative paths
- Router should handle the base path

## Step 8: Verify Deployment

```bash
# Check nginx status
sudo systemctl status nginx

# Check PM2 processes
pm2 status
pm2 logs kedge-api-server

# Test endpoints
curl http://your-domain.com  # Should return practice app
curl http://your-domain.com/quiz-parser  # Should return quiz parser app
curl http://your-domain.com/api/health  # Should return "OK"
```

## Monitoring

```bash
# View PM2 dashboard
pm2 monit

# View logs
pm2 logs kedge-api-server --lines 100

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Updates and Maintenance

To update the application:

```bash
# 1. Build new versions locally
# 2. Upload new files
# 3. For backend:
pm2 reload kedge-api-server

# 4. For frontend (just replace files):
scp -r frontend-practice/dist/* $SERVER:/var/www/kedge-practice/
scp -r frontend-quiz-parser/dist/* $SERVER:/var/www/kedge-quiz-parser/
```

## Troubleshooting

### Frontend not loading
- Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify file permissions: `ls -la /var/www/`
- Check if files exist: `ls /var/www/kedge-practice/`

### API not responding
- Check PM2 status: `pm2 status`
- View logs: `pm2 logs kedge-api-server`
- Test directly: `curl http://localhost:8718/v1/health`

### Quiz parser not working at /quiz-parser
- Ensure vite was built with `base: '/quiz-parser/'`
- Check nginx alias configuration
- Verify assets are loading with correct paths

### CORS issues
- Update CORS_ORIGIN in PM2 config
- Check nginx CORS headers
- Ensure frontend uses correct API URL

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure firewall (ufw)
- [ ] Set up fail2ban for SSH
- [ ] Regular security updates
- [ ] Backup database regularly
- [ ] Monitor server resources
- [ ] Set up log rotation

## Links Between Apps

The frontend-practice app should link to quiz-parser like this:

```javascript
// In frontend-practice components
<a href="/quiz-parser" target="_blank">
  Open Quiz Parser Tool
</a>
```

This will work because both apps are served from the same domain.