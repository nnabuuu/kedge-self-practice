#!/bin/bash

# Deployment script for kedge-self-practice
# This script builds and deploys both frontend applications

set -e  # Exit on error

echo "🚀 Starting deployment process..."

# Configuration
DEPLOY_HOST="your-server.com"  # Replace with your server
DEPLOY_USER="ubuntu"            # Replace with your SSH user
BACKEND_URL="http://your-server.com/api"  # Your backend API URL
QUIZ_PARSER_URL="/quiz-parser"  # Quiz parser will be at same domain

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Step 1: Build frontend-practice
print_status "Building frontend-practice..."
cd frontend-practice

# Create production environment file
cat > .env.production <<EOF
VITE_API_BASE_URL=$BACKEND_URL
VITE_QUIZ_PARSER_URL=$QUIZ_PARSER_URL
EOF

npm install
npm run build

if [ ! -d "dist" ]; then
    print_error "Build failed for frontend-practice"
    exit 1
fi

print_status "frontend-practice built successfully"

# Step 2: Build frontend-quiz-parser
print_status "Building frontend-quiz-parser..."
cd ../frontend-quiz-parser

# Update the API configuration for quiz-parser
cat > .env.production <<EOF
VITE_API_BASE_URL=$BACKEND_URL
EOF

# If quiz-parser needs special base path for routing
# Update vite.config.ts to add: base: '/quiz-parser/'

npm install
npm run build

if [ ! -d "dist" ]; then
    print_error "Build failed for frontend-quiz-parser"
    exit 1
fi

print_status "frontend-quiz-parser built successfully"

# Step 3: Create deployment archive
print_status "Creating deployment archive..."
cd ..
mkdir -p deployment/dist

# Copy built files
cp -r frontend-practice/dist deployment/dist/practice
cp -r frontend-quiz-parser/dist deployment/dist/quiz-parser

# Create deployment info file
cat > deployment/dist/deploy-info.json <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "backend_url": "$BACKEND_URL",
  "quiz_parser_url": "$QUIZ_PARSER_URL"
}
EOF

print_status "Deployment archive created"

# Step 4: Deploy to server (optional - uncomment to enable)
# print_status "Deploying to server..."
# 
# # Upload files
# rsync -avz --delete deployment/dist/practice/ $DEPLOY_USER@$DEPLOY_HOST:/var/www/kedge-practice/
# rsync -avz --delete deployment/dist/quiz-parser/ $DEPLOY_USER@$DEPLOY_HOST:/var/www/kedge-quiz-parser/
# 
# # Upload nginx config
# scp deployment/nginx-full-config.conf $DEPLOY_USER@$DEPLOY_HOST:/tmp/
# 
# # Apply nginx config and restart
# ssh $DEPLOY_USER@$DEPLOY_HOST <<'ENDSSH'
#     sudo cp /tmp/nginx-full-config.conf /etc/nginx/sites-available/kedge
#     sudo ln -sf /etc/nginx/sites-available/kedge /etc/nginx/sites-enabled/
#     sudo nginx -t && sudo systemctl reload nginx
#     echo "✓ Nginx reloaded successfully"
# ENDSSH

print_status "Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy deployment/dist/practice/* to /var/www/kedge-practice/"
echo "2. Copy deployment/dist/quiz-parser/* to /var/www/kedge-quiz-parser/"
echo "3. Configure nginx with deployment/nginx-full-config.conf"
echo "4. Ensure backend is running on port 8718"
echo "5. Set up SSL certificates with Let's Encrypt (optional)"