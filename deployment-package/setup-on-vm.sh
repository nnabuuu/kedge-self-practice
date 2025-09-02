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
