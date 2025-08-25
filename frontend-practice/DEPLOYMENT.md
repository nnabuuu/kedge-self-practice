# Frontend Deployment Guide - Manual Setup with Nginx

## Prerequisites
- A remote VM (Ubuntu/Debian recommended)
- SSH access to the VM
- Node.js 18+ installed on the VM
- Domain name (optional, can use IP address)

## Step 1: Build the Frontend Locally

First, build the production version of your frontend locally:

```bash
cd frontend-practice
npm run build
```

This will create a `dist` folder with all the static files.

## Step 2: Install Nginx on Remote VM

SSH into your remote VM:
```bash
ssh user@your-vm-ip
```

Install nginx:
```bash
# Update package list
sudo apt update

# Install nginx
sudo apt install nginx -y

# Start nginx and enable it to start on boot
sudo systemctl start nginx
sudo systemctl enable nginx

# Check nginx status
sudo systemctl status nginx
```

## Step 3: Transfer Build Files to VM

From your local machine, transfer the built files to the VM:

```bash
# Create a directory for your app on the VM first
ssh user@your-vm-ip "sudo mkdir -p /var/www/kedge-practice"
ssh user@your-vm-ip "sudo chown -R $USER:$USER /var/www/kedge-practice"

# Transfer the dist folder contents
scp -r dist/* user@your-vm-ip:/var/www/kedge-practice/
```

Alternative using rsync (better for updates):
```bash
rsync -avz --delete dist/ user@your-vm-ip:/var/www/kedge-practice/
```

## Step 4: Configure Nginx

Create an nginx configuration file for your site:

```bash
ssh user@your-vm-ip
sudo nano /etc/nginx/sites-available/kedge-practice
```

Add this configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    
    # Replace with your domain or use _
    server_name your-domain.com;
    
    # Root directory where your app is located
    root /var/www/kedge-practice;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Handle client-side routing (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # API proxy (if backend is on same server)
    # Uncomment and modify if needed
    # location /api {
    #     proxy_pass http://localhost:8718;
    #     proxy_http_version 1.1;
    #     proxy_set_header Upgrade $http_upgrade;
    #     proxy_set_header Connection 'upgrade';
    #     proxy_set_header Host $host;
    #     proxy_cache_bypass $http_upgrade;
    # }
}
```

Enable the site:
```bash
# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/kedge-practice /etc/nginx/sites-enabled/

# Remove default site if needed
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Step 5: Configure Environment Variables

Create an environment configuration file on the VM:

```bash
# Create .env file in your app directory
nano /var/www/kedge-practice/.env
```

However, since Vite builds environment variables at build time, you need to:

1. **Option A: Build on the server** (Recommended for sensitive data)
   ```bash
   # Install Node.js on server if not already installed
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Transfer source code instead of dist
   scp -r ./* user@your-vm-ip:/tmp/kedge-practice-src/
   
   # Build on server with production env vars
   ssh user@your-vm-ip
   cd /tmp/kedge-practice-src
   echo "VITE_API_BASE_URL=http://your-backend-url:8718" > .env.production
   npm install
   npm run build
   sudo cp -r dist/* /var/www/kedge-practice/
   ```

2. **Option B: Configure API URL dynamically**
   Create a config file that can be modified on the server:
   ```bash
   # Create a config.js in public folder before building
   echo "window.API_CONFIG = { baseUrl: 'http://your-backend-url:8718' };" > public/config.js
   ```
   Then reference it in index.html and use in your app.

## Step 6: Set Up Firewall

Configure firewall to allow HTTP/HTTPS traffic:

```bash
# If using ufw
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## Step 7: SSL Certificate (Optional but Recommended)

Install Certbot for Let's Encrypt SSL:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
# Test renewal
sudo certbot renew --dry-run
```

## Step 8: Backend API Configuration

Update your frontend to connect to the backend. If backend is on a different server:

1. Ensure backend allows CORS from your frontend domain
2. Update API_BASE_URL in your build configuration
3. Rebuild and redeploy if needed

## Step 9: Monitoring and Logs

Check nginx logs:
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

## Step 10: Update Script

Create an update script for easy redeployment:

```bash
# Create update.sh on your local machine
cat > deploy.sh << 'EOF'
#!/bin/bash
echo "Building frontend..."
npm run build

echo "Deploying to server..."
rsync -avz --delete dist/ user@your-vm-ip:/var/www/kedge-practice/

echo "Deployment complete!"
EOF

chmod +x deploy.sh
```

## Troubleshooting

### 1. 404 errors on page refresh
Make sure the nginx `try_files` directive is configured correctly for React Router.

### 2. CORS issues
- Check backend CORS configuration
- Ensure API_BASE_URL is correct
- Check browser console for specific CORS error messages

### 3. Static files not loading
- Check file permissions: `ls -la /var/www/kedge-practice/`
- Fix permissions if needed: `sudo chown -R www-data:www-data /var/www/kedge-practice/`

### 4. Nginx not starting
- Check configuration: `sudo nginx -t`
- Check logs: `sudo journalctl -xe`
- Check port conflicts: `sudo netstat -tlnp | grep :80`

## Security Checklist

- [ ] Firewall configured (only necessary ports open)
- [ ] SSL certificate installed
- [ ] Security headers configured in nginx
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Disable root SSH login
- [ ] Use SSH keys instead of passwords
- [ ] Regular backups configured

## Performance Optimization

1. **Enable Gzip compression** (already in config above)
2. **Cache static assets** (already in config above)
3. **Use CDN for static assets** (optional)
4. **Enable HTTP/2** (automatic with SSL)
5. **Optimize images** before deployment

## Maintenance

Regular maintenance tasks:
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Renew SSL certificate (automatic, but can force)
sudo certbot renew

# Check disk space
df -h

# Monitor nginx logs
sudo tail -f /var/log/nginx/error.log
```

## Quick Commands Reference

```bash
# Nginx commands
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# File permissions
sudo chown -R www-data:www-data /var/www/kedge-practice/
sudo chmod -R 755 /var/www/kedge-practice/
```