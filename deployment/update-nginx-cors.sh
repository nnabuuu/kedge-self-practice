#!/bin/bash

# Script to update nginx configuration with CORS fix on remote server
# This fixes the CORS error when uploading DOCX files

echo "=== Nginx CORS Fix Deployment Script ==="
echo "This script will update the nginx configuration to fix CORS errors"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running with sudo or as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run this script with sudo${NC}"
    echo "Usage: sudo ./update-nginx-cors.sh"
    exit 1
fi

echo -e "${YELLOW}Step 1: Backing up current nginx configuration${NC}"
cp /etc/nginx/sites-available/cyez /etc/nginx/sites-available/cyez.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✓ Backup created${NC}"

echo -e "${YELLOW}Step 2: Creating new nginx configuration with CORS fix${NC}"
cat > /etc/nginx/sites-available/cyez << 'EOF'
# Nginx configuration for cyez.zhushou.one with CORS fix
# Student Practice at: cyez.zhushou.one
# Teacher Parser at: cyez.zhushou.one/parser

server {
    
    # Your domain
    server_name cyez.zhushou.one;
    
    # Logging
    access_log /var/log/nginx/cyez-access.log;
    error_log /var/log/nginx/cyez-error.log;
    
    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json application/rss+xml application/atom+xml image/svg+xml;
    gzip_disable "MSIE [1-6]\.";
    
    # Security headers (global)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Teacher Parser App at /parser
    location /parser {
        alias /var/www/kedge-quiz-parser;
        try_files $uri $uri/ /parser/index.html;
    }
    
    # API proxy - handles all /v1/* requests
    location /v1/ {
        # Handle CORS preflight
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
        
        # Add CORS headers to all responses (including errors) - THIS IS THE FIX
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        # Backend server
        proxy_pass http://localhost:8718;
        
        # Proxy headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for large file uploads
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
        
        # Buffer settings for file uploads
        proxy_request_buffering off;
        proxy_buffering off;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Student Practice App (root path) - MUST be after specific paths
    location / {
        root /var/www/kedge-practice;
        try_files $uri $uri/ /index.html;
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Deny access to sensitive file extensions
    location ~* \.(bak|config|sql|fla|psd|ini|log|sh|inc|swp|dist|env)$ {
        deny all;
    }
    
    # Client body size limit (50MB for DOCX uploads)
    client_max_body_size 50M;
    
    # Timeouts
    client_body_timeout 60;
    client_header_timeout 60;
    keepalive_timeout 65;
    send_timeout 60;

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/cyez.zhushou.one/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/cyez.zhushou.one/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

# HTTP to HTTPS redirect
server {
    if ($host = cyez.zhushou.one) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    listen [::]:80;
    server_name cyez.zhushou.one;
    return 404; # managed by Certbot
}
EOF

echo -e "${GREEN}✓ New configuration created${NC}"

echo -e "${YELLOW}Step 3: Testing nginx configuration${NC}"
nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Configuration test passed${NC}"
    
    echo -e "${YELLOW}Step 4: Reloading nginx${NC}"
    systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Nginx reloaded successfully${NC}"
        echo ""
        echo -e "${GREEN}=== CORS fix applied successfully ===${NC}"
        echo "The nginx configuration has been updated with proper CORS headers."
        echo "CORS headers will now be included on all responses (including errors)."
        echo ""
        echo "You can now test DOCX upload from the frontend."
    else
        echo -e "${RED}✗ Failed to reload nginx${NC}"
        echo "Rolling back to previous configuration..."
        cp /etc/nginx/sites-available/cyez.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/cyez
        systemctl reload nginx
        echo "Rolled back to previous configuration"
        exit 1
    fi
else
    echo -e "${RED}✗ Configuration test failed${NC}"
    echo "Please check the error messages above"
    echo "The original configuration has not been changed"
    exit 1
fi

echo ""
echo "Backup file location: /etc/nginx/sites-available/cyez.backup.*"
echo "If you need to rollback, use: sudo cp /etc/nginx/sites-available/cyez.backup.* /etc/nginx/sites-available/cyez && sudo systemctl reload nginx"