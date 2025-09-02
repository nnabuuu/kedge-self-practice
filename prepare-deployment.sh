#!/bin/bash

# Script to prepare deployment package for manual VM deployment
# This creates a deployment.tar.gz file that you can transfer to the VM

set -e  # Exit on error

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}    Preparing Deployment Package for VM       ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# Step 1: Build Practice Frontend
echo -e "${YELLOW}📚 Building Student Practice App...${NC}"
cd frontend-practice

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: frontend-practice not found${NC}"
    exit 1
fi

# Create production env file with parser URL
# Change VITE_ORG_NAME to your organization name
cat > .env.production << EOF
VITE_ORG_NAME=曹杨二中
VITE_API_BASE_URL=http://34.31.89.197
VITE_QUIZ_PARSER_URL=http://34.31.89.197/parser
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
echo "VITE_API_BASE_URL=https://cyez.zhushou.one" > .env.production

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
cp nginx-cyez.conf deployment-package/

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
if [ ! -f /etc/nginx/sites-available/cyez ]; then
    echo "Setting up nginx configuration..."
    sudo cp nginx-cyez.conf /etc/nginx/sites-available/cyez
    sudo ln -s /etc/nginx/sites-available/cyez /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
fi

# Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

echo -e "${GREEN}✅ Setup complete!${NC}"
echo "Visit: http://34.31.89.197"
echo "Parser: https://34.31.89.197/parser"
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
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Transfer deployment.tar.gz to your VM using:"
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
echo "   sudo nano /etc/nginx/sites-available/cyez"
echo "   (Change proxy_pass to your backend URL)"
echo ""
echo -e "${GREEN}Good luck with your deployment! 🚀${NC}"
