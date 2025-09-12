#!/bin/bash

# Script to prepare deployment package for cyez.edunest.cn
# This creates a deployment.tar.gz file for deployment to the server

set -e  # Exit on error

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}    Preparing Deployment for cyez.edunest.cn    ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# Step 1: Build Practice Frontend
echo -e "${YELLOW}📚 Building Student Practice App...${NC}"
cd frontend-practice

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: frontend-practice not found${NC}"
    exit 1
fi

# Create production env file for cyez.edunest.cn
cat > .env.production << EOF
VITE_ORG_NAME=曹杨二中
VITE_API_BASE_URL=https://cyez.edunest.cn
VITE_QUIZ_PARSER_URL=https://cyez.edunest.cn/parser
EOF

# Install and build
npm install
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Practice app build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Practice app built${NC}"

# Step 2: Build Parser Frontend
echo -e "${YELLOW}📝 Building Teacher Quiz Parser App...${NC}"
cd ../frontend-quiz-parser

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: frontend-quiz-parser not found${NC}"
    exit 1
fi

# Create production env file
echo "VITE_API_BASE_URL=https://cyez.edunest.cn" > .env.production

# Install and build with /parser base path
npm install

# Use parser config if available
if [ -f "vite.config.parser.ts" ]; then
    echo "Building with vite.config.parser.ts (includes base: '/parser/')"
    npx vite build --config vite.config.parser.ts
else
    # Add base path to regular config temporarily
    echo "Adding base: '/parser/' to vite.config.ts"
    sed -i.bak "s|// base: '/parser/',|base: '/parser/',|" vite.config.ts
    npm run build
    # Restore original config
    mv vite.config.ts.bak vite.config.ts
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Parser app build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Parser app built${NC}"
cd ..

# Step 3: Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"

# Clean up old package
rm -rf deployment-package
rm -f deployment-cyez-edunest.tar.gz

# Create package structure
mkdir -p deployment-package
cp -r frontend-practice/dist deployment-package/practice
cp -r frontend-quiz-parser/dist deployment-package/parser

# Create nginx configuration for cyez.edunest.cn
cat > deployment-package/nginx-cyez-edunest.conf << 'NGINX_EOF'
# Configuration for cyez.edunest.cn
# Direct deployment on 47.99.175.26

# HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name cyez.edunest.cn;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    server_name cyez.edunest.cn;

    # Logging
    access_log /var/log/nginx/cyez-edunest-access.log;
    error_log /var/log/nginx/cyez-edunest-error.log;

    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml 
application/javascript application/json application/rss+xml application/atom+xml image/svg+xml;
    gzip_disable "MSIE [1-6]\.";

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Teacher Parser App at /parser
    location /parser {
        alias /var/www/kedge-quiz-parser;
        try_files $uri $uri/ /parser/index.html;
    }

    # API proxy (to local backend on same server)
    location /v1/ {
        proxy_pass http://localhost:8718/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 360s;
        proxy_send_timeout 360s;
        proxy_read_timeout 360s;
        proxy_request_buffering off;
        proxy_buffering off;
    }

    # Attachments
    location /attachments/ {
        proxy_pass http://localhost:8718/attachments/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8718/health;
        access_log off;
    }

    # Swagger UI
    location /swagger-ui {
        proxy_pass http://localhost:8718/swagger-ui;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Student Practice App (root)
    location / {
        root /var/www/kedge-practice;
        try_files $uri $uri/ /index.html;
    }

    # Deny hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Deny sensitive files
    location ~* \.(bak|config|sql|fla|psd|ini|log|sh|inc|swp|dist|env)$ {
        deny all;
    }

    client_max_body_size 50M;
    client_body_timeout 60;
    client_header_timeout 60;
    keepalive_timeout 65;
    send_timeout 60;

    listen [::]:443 ssl ipv6only=on;
    listen 443 ssl;
    
    # SSL certificates (you need to copy these from 47.100.82.103)
    ssl_certificate /etc/nginx/cert/_.edunest.cn_bundle.crt;
    ssl_certificate_key /etc/nginx/cert/_.edunest.cn.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
}
NGINX_EOF

# Create setup script for server
cat > deployment-package/setup-on-server.sh << 'EOF'
#!/bin/bash

# This script runs ON THE SERVER (47.99.175.26) after extracting deployment package

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Setting up cyez.edunest.cn on server...${NC}"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run with sudo${NC}"
    exit 1
fi

# Create directories
echo "Creating web directories..."
mkdir -p /var/www/kedge-practice
mkdir -p /var/www/kedge-quiz-parser
mkdir -p /etc/nginx/cert

# Copy files
echo "Copying practice app..."
cp -r practice/* /var/www/kedge-practice/

echo "Copying parser app..."
cp -r parser/* /var/www/kedge-quiz-parser/

# Set permissions
chown -R www-data:www-data /var/www/kedge-practice
chown -R www-data:www-data /var/www/kedge-quiz-parser
chmod -R 755 /var/www/kedge-practice
chmod -R 755 /var/www/kedge-quiz-parser

# Setup nginx
echo "Setting up nginx configuration..."
cp nginx-cyez-edunest.conf /etc/nginx/sites-available/cyez-edunest

# Enable site if not already enabled
if [ ! -L /etc/nginx/sites-enabled/cyez-edunest ]; then
    ln -s /etc/nginx/sites-available/cyez-edunest /etc/nginx/sites-enabled/
fi

# Check if certificates exist
if [ ! -f /etc/nginx/cert/_.edunest.cn_bundle.crt ]; then
    echo -e "${YELLOW}⚠️  SSL certificates not found!${NC}"
    echo "Please copy certificates from nginx proxy server (47.100.82.103):"
    echo "  scp root@47.100.82.103:/etc/nginx/cert/_.edunest.cn_bundle.crt /etc/nginx/cert/"
    echo "  scp root@47.100.82.103:/etc/nginx/cert/_.edunest.cn.key /etc/nginx/cert/"
    echo ""
    echo "Or from another location if you have them."
    echo ""
fi

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    # Reload nginx
    echo "Reloading nginx..."
    systemctl reload nginx
    
    echo -e "${GREEN}✅ Setup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Ensure SSL certificates are in place"
    echo "2. Update DNS to point cyez.edunest.cn to this server (47.99.175.26)"
    echo "3. Update backend CORS settings to allow https://cyez.edunest.cn"
    echo ""
    echo "Visit: https://cyez.edunest.cn"
    echo "Parser: https://cyez.edunest.cn/parser"
    echo "API: https://cyez.edunest.cn/v1/"
else
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    echo "Please check the configuration and try again"
fi
EOF

chmod +x deployment-package/setup-on-server.sh

# Create deployment instructions
cat > deployment-package/DEPLOY_INSTRUCTIONS.md << 'EOF'
# Deployment Instructions for cyez.edunest.cn

## Target Server
- **Server IP**: 47.99.175.26
- **Domain**: cyez.edunest.cn
- **Backend**: Already running on port 8718

## Prerequisites
- Nginx installed on server
- Backend API running on port 8718
- SSL certificates for *.edunest.cn

## Deployment Steps

### 1. Transfer Package to Server
```bash
scp deployment-cyez-edunest.tar.gz root@47.99.175.26:/tmp/
```

### 2. Extract and Setup on Server
```bash
ssh root@47.99.175.26
cd /tmp
tar -xzf deployment-cyez-edunest.tar.gz
cd deployment-package
sudo ./setup-on-server.sh
```

### 3. Copy SSL Certificates (if not already done)
From your nginx proxy server (47.100.82.103):
```bash
scp /etc/nginx/cert/_.edunest.cn_bundle.crt root@47.99.175.26:/etc/nginx/cert/
scp /etc/nginx/cert/_.edunest.cn.key root@47.99.175.26:/etc/nginx/cert/
```

### 4. Update DNS
Point cyez.edunest.cn to 47.99.175.26 in your DNS provider.

### 5. Update Backend CORS
Ensure backend .env includes:
```
CORS_ORIGIN=https://cyez.edunest.cn
```

Then restart backend:
```bash
pm2 restart kedge-api
# or
systemctl restart kedge-api
```

## Verification

### Test HTTPS
```bash
curl -I https://cyez.edunest.cn
```

### Test API
```bash
curl https://cyez.edunest.cn/v1/health
```

### Check Logs
```bash
tail -f /var/log/nginx/cyez-edunest-access.log
tail -f /var/log/nginx/cyez-edunest-error.log
```

## Troubleshooting

### Certificate Issues
- Verify certificates are in /etc/nginx/cert/
- Check certificate validity: `openssl x509 -in /etc/nginx/cert/_.edunest.cn_bundle.crt -text -noout`

### 502 Bad Gateway
- Check backend is running: `pm2 status` or `systemctl status kedge-api`
- Check backend logs: `pm2 logs` or `journalctl -u kedge-api`

### CORS Issues
- Check backend CORS_ORIGIN environment variable
- Restart backend after changes

## Quick Update

For future updates, just rebuild and redeploy:
```bash
# On local machine
./prepare-deployment-cyez-edunest.sh

# Transfer and extract
scp deployment-cyez-edunest.tar.gz root@47.99.175.26:/tmp/
ssh root@47.99.175.26
cd /tmp && tar -xzf deployment-cyez-edunest.tar.gz
cd deployment-package && sudo ./setup-on-server.sh
```
EOF

# Create the tar file
tar -czf deployment-cyez-edunest.tar.gz deployment-package/

# Calculate size
SIZE=$(du -h deployment-cyez-edunest.tar.gz | cut -f1)

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}         ✅ Package Created Successfully        ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "📦 File: ${GREEN}deployment-cyez-edunest.tar.gz${NC} (${SIZE})"
echo -e "🎯 Target: ${GREEN}https://cyez.edunest.cn${NC}"
echo -e "🖥️  Server: ${GREEN}47.99.175.26${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Transfer package to server:"
echo "   ${GREEN}scp deployment-cyez-edunest.tar.gz root@47.99.175.26:/tmp/${NC}"
echo ""
echo "2. SSH to server and run setup:"
echo "   ${GREEN}ssh root@47.99.175.26${NC}"
echo "   ${GREEN}cd /tmp && tar -xzf deployment-cyez-edunest.tar.gz${NC}"
echo "   ${GREEN}cd deployment-package && sudo ./setup-on-server.sh${NC}"
echo ""
echo "3. Copy SSL certificates from nginx proxy (if needed):"
echo "   ${GREEN}scp root@47.100.82.103:/etc/nginx/cert/*.edunest.cn* root@47.99.175.26:/etc/nginx/cert/${NC}"
echo ""
echo "4. Update DNS A record:"
echo "   ${GREEN}cyez.edunest.cn → 47.99.175.26${NC}"
echo ""
echo -e "${GREEN}Good luck with your deployment! 🚀${NC}"