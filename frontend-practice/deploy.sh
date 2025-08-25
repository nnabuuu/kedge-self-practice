#!/bin/bash

# Deployment script for Kedge Practice Frontend
# Usage: ./deploy.sh user@your-server-ip

if [ $# -eq 0 ]; then
    echo "Usage: $0 user@server-ip"
    echo "Example: $0 ubuntu@192.168.1.100"
    exit 1
fi

SERVER=$1
APP_DIR="/var/www/kedge-practice"

echo "🚀 Starting deployment to $SERVER"

# Build the production version
echo "📦 Building production version..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Create directory on server if it doesn't exist
echo "📁 Creating app directory on server..."
ssh $SERVER "sudo mkdir -p $APP_DIR && sudo chown -R \$USER:\$USER $APP_DIR"

# Transfer files
echo "📤 Transferring files to server..."
rsync -avz --delete dist/ $SERVER:$APP_DIR/

if [ $? -ne 0 ]; then
    echo "❌ File transfer failed!"
    exit 1
fi

echo "✅ Files transferred successfully!"

# Copy nginx configuration if it doesn't exist
echo "🔧 Checking nginx configuration..."
ssh $SERVER "test -f /etc/nginx/sites-available/kedge-practice"
if [ $? -ne 0 ]; then
    echo "📝 Copying nginx configuration..."
    scp nginx.conf $SERVER:/tmp/kedge-practice.conf
    ssh $SERVER "sudo mv /tmp/kedge-practice.conf /etc/nginx/sites-available/kedge-practice"
    ssh $SERVER "sudo ln -sf /etc/nginx/sites-available/kedge-practice /etc/nginx/sites-enabled/"
    ssh $SERVER "sudo nginx -t && sudo systemctl reload nginx"
fi

# Set proper permissions
echo "🔐 Setting file permissions..."
ssh $SERVER "sudo chown -R www-data:www-data $APP_DIR"
ssh $SERVER "sudo chmod -R 755 $APP_DIR"

echo "✨ Deployment complete!"
echo "🌐 Your app should be accessible at http://$SERVER"
echo ""
echo "📝 Next steps:"
echo "1. Update the backend URL in nginx.conf if needed"
echo "2. Set up SSL certificate with: sudo certbot --nginx"
echo "3. Configure firewall if needed"