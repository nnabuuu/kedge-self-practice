#!/bin/bash

# Deployment script for cyez.zhushou.one
# Deploys both frontends to the correct locations
# Usage: ./deploy-cyez.sh user@your-server-ip

if [ $# -eq 0 ]; then
    echo "Usage: $0 user@server-ip"
    echo "Example: $0 ubuntu@192.168.1.100"
    exit 1
fi

SERVER=$1

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Deploying to cyez.zhushou.one         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# App directories on server
PRACTICE_DIR="/var/www/kedge-practice"
PARSER_DIR="/var/www/kedge-quiz-parser"

# Step 1: Build and deploy Student Practice Frontend
echo -e "${GREEN}📚 Step 1: Building Student Practice App${NC}"
cd frontend-practice

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in frontend-practice directory${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build with production environment
echo "Building production version..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Practice frontend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Practice app built successfully${NC}"

# Step 2: Build and deploy Quiz Parser Frontend
echo -e "${GREEN}📝 Step 2: Building Teacher Quiz Parser App${NC}"
cd ../frontend-quiz-parser

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in frontend-quiz-parser directory${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build with /parser base path
echo "Building with /parser base path..."
if [ -f "vite.config.parser.ts" ]; then
    # Use the parser-specific config
    npx vite build --config vite.config.parser.ts
else
    # Regular build (you may need to update vite.config.ts with base: '/parser/')
    npm run build
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Parser frontend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Parser app built successfully${NC}"
cd ..

# Step 3: Create directories on server
echo -e "${YELLOW}📁 Step 3: Setting up server directories${NC}"
ssh $SERVER "sudo mkdir -p $PRACTICE_DIR $PARSER_DIR"
ssh $SERVER "sudo chown -R \$USER:\$USER $PRACTICE_DIR $PARSER_DIR"

# Step 4: Transfer files
echo -e "${YELLOW}📤 Step 4: Transferring files to server${NC}"

echo "Uploading practice app..."
rsync -avz --delete frontend-practice/dist/ $SERVER:$PRACTICE_DIR/

echo "Uploading parser app..."
rsync -avz --delete frontend-quiz-parser/dist/ $SERVER:$PARSER_DIR/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ File transfer failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Files transferred successfully${NC}"

# Step 5: Setup nginx (first time only)
echo -e "${YELLOW}🔧 Step 5: Configuring Nginx${NC}"

# Check if nginx config exists
ssh $SERVER "test -f /etc/nginx/sites-available/cyez"
if [ $? -ne 0 ]; then
    echo "Setting up nginx configuration..."
    
    # Copy nginx config
    scp nginx-cyez.conf $SERVER:/tmp/cyez.conf
    
    # Install on server
    ssh $SERVER "sudo mv /tmp/cyez.conf /etc/nginx/sites-available/cyez"
    ssh $SERVER "sudo ln -sf /etc/nginx/sites-available/cyez /etc/nginx/sites-enabled/"
    
    # Remove default site if exists
    ssh $SERVER "sudo rm -f /etc/nginx/sites-enabled/default"
    
    # Test configuration
    ssh $SERVER "sudo nginx -t"
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Nginx configuration test failed!${NC}"
        echo "Please check the configuration on the server"
        exit 1
    fi
    
    # Reload nginx
    ssh $SERVER "sudo systemctl reload nginx"
    echo -e "${GREEN}✅ Nginx configured${NC}"
else
    echo "Nginx already configured, reloading..."
    ssh $SERVER "sudo systemctl reload nginx"
fi

# Step 6: Set proper permissions
echo -e "${YELLOW}🔐 Step 6: Setting permissions${NC}"
ssh $SERVER "sudo chown -R www-data:www-data $PRACTICE_DIR $PARSER_DIR"
ssh $SERVER "sudo chmod -R 755 $PRACTICE_DIR $PARSER_DIR"

# Step 7: Verify deployment
echo -e "${YELLOW}🔍 Step 7: Verifying deployment${NC}"

# Check if files exist
ssh $SERVER "test -f $PRACTICE_DIR/index.html"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Practice app files verified${NC}"
else
    echo -e "${RED}⚠️  Warning: Practice app index.html not found${NC}"
fi

ssh $SERVER "test -f $PARSER_DIR/index.html"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Parser app files verified${NC}"
else
    echo -e "${RED}⚠️  Warning: Parser app index.html not found${NC}"
fi

# Done!
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        🎉 Deployment Complete! 🎉          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📱 Access your applications:${NC}"
echo -e "  Student Practice: ${GREEN}http://cyez.zhushou.one${NC}"
echo -e "  Teacher Parser:   ${GREEN}http://cyez.zhushou.one/parser${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Update backend URL in nginx config if needed:"
echo "   ssh $SERVER 'sudo nano /etc/nginx/sites-available/cyez'"
echo ""
echo "2. Set up SSL certificate:"
echo "   ssh $SERVER 'sudo certbot --nginx -d cyez.zhushou.one'"
echo ""
echo "3. Configure firewall if needed:"
echo "   ssh $SERVER 'sudo ufw allow 80,443/tcp'"
echo ""
echo -e "${BLUE}📊 Monitor logs:${NC}"
echo "   ssh $SERVER 'sudo tail -f /var/log/nginx/cyez-error.log'"