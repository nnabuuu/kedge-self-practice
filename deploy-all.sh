#!/bin/bash

# Deployment script for all Kedge frontends
# Usage: ./deploy-all.sh user@your-server-ip [practice|parser|all]

if [ $# -lt 1 ]; then
    echo "Usage: $0 user@server-ip [practice|parser|all]"
    echo "Examples:"
    echo "  $0 ubuntu@192.168.1.100 all      # Deploy both frontends"
    echo "  $0 ubuntu@192.168.1.100 practice # Deploy only practice frontend"
    echo "  $0 ubuntu@192.168.1.100 parser   # Deploy only parser frontend"
    exit 1
fi

SERVER=$1
DEPLOY_TARGET=${2:-all}

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# App directories on server
PRACTICE_DIR="/var/www/kedge-practice"
PARSER_DIR="/var/www/kedge-quiz-parser"

echo -e "${GREEN}🚀 Starting deployment to $SERVER${NC}"
echo -e "${YELLOW}📦 Deploy target: $DEPLOY_TARGET${NC}"

# Function to build and deploy practice frontend
deploy_practice() {
    echo -e "${GREEN}📚 Deploying Student Practice Frontend${NC}"
    
    # Navigate to practice frontend
    cd frontend-practice
    
    # Build
    echo "Building frontend-practice..."
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Practice frontend build failed!${NC}"
        exit 1
    fi
    
    # Create directory on server
    echo "Creating directory on server..."
    ssh $SERVER "sudo mkdir -p $PRACTICE_DIR && sudo chown -R \$USER:\$USER $PRACTICE_DIR"
    
    # Transfer files
    echo "Transferring files..."
    rsync -avz --delete dist/ $SERVER:$PRACTICE_DIR/
    
    # Set permissions
    ssh $SERVER "sudo chown -R www-data:www-data $PRACTICE_DIR && sudo chmod -R 755 $PRACTICE_DIR"
    
    echo -e "${GREEN}✅ Practice frontend deployed!${NC}"
    cd ..
}

# Function to build and deploy parser frontend
deploy_parser() {
    echo -e "${GREEN}📝 Deploying Teacher Quiz Parser Frontend${NC}"
    
    # Navigate to parser frontend
    cd frontend-quiz-parser
    
    # Build
    echo "Building frontend-quiz-parser..."
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Parser frontend build failed!${NC}"
        exit 1
    fi
    
    # Create directory on server
    echo "Creating directory on server..."
    ssh $SERVER "sudo mkdir -p $PARSER_DIR && sudo chown -R \$USER:\$USER $PARSER_DIR"
    
    # Transfer files
    echo "Transferring files..."
    rsync -avz --delete dist/ $SERVER:$PARSER_DIR/
    
    # Set permissions
    ssh $SERVER "sudo chown -R www-data:www-data $PARSER_DIR && sudo chmod -R 755 $PARSER_DIR"
    
    echo -e "${GREEN}✅ Parser frontend deployed!${NC}"
    cd ..
}

# Function to setup nginx (only needs to be done once)
setup_nginx() {
    echo -e "${YELLOW}🔧 Setting up Nginx configuration${NC}"
    
    # Check if nginx config exists
    ssh $SERVER "test -f /etc/nginx/sites-available/kedge-apps"
    if [ $? -ne 0 ]; then
        echo "Copying nginx configuration..."
        scp nginx-multi-frontend.conf $SERVER:/tmp/kedge-apps.conf
        ssh $SERVER "sudo mv /tmp/kedge-apps.conf /etc/nginx/sites-available/kedge-apps"
        ssh $SERVER "sudo ln -sf /etc/nginx/sites-available/kedge-apps /etc/nginx/sites-enabled/"
        
        # Remove default site if exists
        ssh $SERVER "sudo rm -f /etc/nginx/sites-enabled/default"
        
        # Test and reload nginx
        ssh $SERVER "sudo nginx -t"
        if [ $? -eq 0 ]; then
            ssh $SERVER "sudo systemctl reload nginx"
            echo -e "${GREEN}✅ Nginx configured successfully!${NC}"
        else
            echo -e "${RED}❌ Nginx configuration test failed!${NC}"
            exit 1
        fi
    else
        echo "Nginx already configured, skipping..."
    fi
}

# Deploy based on target
case $DEPLOY_TARGET in
    practice)
        deploy_practice
        ;;
    parser)
        deploy_parser
        ;;
    all)
        deploy_practice
        deploy_parser
        setup_nginx
        ;;
    *)
        echo -e "${RED}Invalid deploy target: $DEPLOY_TARGET${NC}"
        echo "Use: practice, parser, or all"
        exit 1
        ;;
esac

echo -e "${GREEN}✨ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Access your applications:${NC}"
echo "  Student Practice: http://$SERVER/"
echo "  Teacher Parser:   http://$SERVER/parser"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Update nginx config with your domain names"
echo "2. Set up SSL: sudo certbot --nginx"
echo "3. Configure backend URL in nginx if needed"
echo "4. Set up firewall rules if needed"