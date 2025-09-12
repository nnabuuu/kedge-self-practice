#!/bin/bash

# Script to prepare deployment package for manual VM deployment
# This creates a deployment.tar.gz file that you can transfer to the VM
# IP-based version for direct server access

set -e  # Exit on error

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="47.99.175.26"  # Update this with your server IP
API_PORT="8718"

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}    Preparing Deployment Package for VM       ${NC}"
echo -e "${GREEN}         (IP-based: ${SERVER_IP})              ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# Step 1: Build Practice Frontend
echo -e "${YELLOW}📚 Building Student Practice App...${NC}"
cd frontend-practice

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: frontend-practice not found${NC}"
    exit 1
fi

# Create production env file with IP-based URLs
cat > .env.production << EOF
VITE_ORG_NAME=曹杨二中
VITE_API_BASE_URL=http://${SERVER_IP}:${API_PORT}
VITE_QUIZ_PARSER_URL=http://${SERVER_IP}:${API_PORT}/parser
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

# Create production env file with IP-based URL
echo "VITE_API_BASE_URL=http://${SERVER_IP}:${API_PORT}" > .env.production

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
rm -f deployment.tar.gz

# Create package structure
mkdir -p deployment-package
cp -r frontend-practice/dist deployment-package/practice
cp -r frontend-quiz-parser/dist deployment-package/parser

# Create nginx configuration for IP-based deployment
cat > deployment-package/nginx-ip.conf << EOF
server {
    listen 80;
    server_name ${SERVER_IP};

    # Practice app
    location / {
        root /var/www/kedge-practice;
        try_files \$uri \$uri/ /index.html;
    }

    # Parser app under /parser path
    location /parser {
        alias /var/www/kedge-quiz-parser;
        try_files \$uri \$uri/ /parser/index.html;
    }

    # API proxy (if backend is on same server)
    location /api/ {
        proxy_pass http://localhost:${API_PORT}/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # Attachments proxy
    location /attachments/ {
        proxy_pass http://localhost:${API_PORT}/attachments/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# Create setup script for VM
cat > deployment-package/setup-on-vm.sh << 'EOF'
#!/bin/bash

# This script runs ON THE VM after extracting deployment.tar.gz

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Setting up applications on VM...${NC}"

# Create directories
sudo mkdir -p /var/www/kedge-practice
sudo mkdir -p /var/www/kedge-quiz-parser

# Copy files
echo "Copying practice app..."
sudo cp -r practice/* /var/www/kedge-practice/

echo "Copying parser app..."
sudo cp -r parser/* /var/www/kedge-quiz-parser/

# Set permissions
sudo chown -R www-data:www-data /var/www/kedge-practice
sudo chown -R www-data:www-data /var/www/kedge-quiz-parser
sudo chmod -R 755 /var/www/kedge-practice
sudo chmod -R 755 /var/www/kedge-quiz-parser

# Setup nginx if needed
if [ ! -f /etc/nginx/sites-available/kedge-ip ]; then
    echo "Setting up nginx configuration..."
    sudo cp nginx-ip.conf /etc/nginx/sites-available/kedge-ip
    sudo ln -s /etc/nginx/sites-available/kedge-ip /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
fi

# Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

echo -e "${GREEN}✅ Setup complete!${NC}"
echo "Visit Practice App: http://SERVER_IP"
echo "Visit Parser App: http://SERVER_IP/parser"
EOF

chmod +x deployment-package/setup-on-vm.sh

# Create the tar file
tar -czf deployment.tar.gz deployment-package/

# Calculate size
SIZE=$(du -h deployment.tar.gz | cut -f1)

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}         ✅ Package Created Successfully        ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "📦 File: ${GREEN}deployment.tar.gz${NC} (${SIZE})"
echo -e "🎯 Target: ${GREEN}http://${SERVER_IP}${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Transfer deployment.tar.gz to your VM using:"
echo "   - scp deployment.tar.gz root@${SERVER_IP}:/tmp/"
echo "   - Cloud storage (Google Drive, Dropbox)"
echo "   - USB drive"
echo "   - File transfer tool"
echo ""
echo "2. On the VM, extract and run:"
echo "   tar -xzf deployment.tar.gz"
echo "   cd deployment-package"
echo "   ./setup-on-vm.sh"
echo ""
echo "3. Update backend URL if needed:"
echo "   sudo nano /etc/nginx/sites-available/kedge-ip"
echo "   (Change proxy_pass to your backend URL)"
echo ""
echo -e "${GREEN}Good luck with your deployment! 🚀${NC}"