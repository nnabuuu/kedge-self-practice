# 📦 Manual Deployment Guide - Direct VM Access

This guide is for when you're logged directly into the VM (no SSH from local machine).

## 🎯 Overview
You'll build the frontends locally, then transfer the built files to the VM manually (via FTP, SCP, or cloud storage).

## 📁 Part 1: Build Locally (On Your Dev Machine)

### Step 1: Build Both Frontends

```bash
# Navigate to your project
cd kedge-self-practice

# Build Practice Frontend
cd frontend-practice
npm install
npm run build
# This creates a 'dist' folder

# Build Quiz Parser Frontend (with /parser base path)
cd ../frontend-quiz-parser

# First, update vite.config.ts to add base path
# Edit the file and add:  base: '/parser/',

npm install
npm run build
# This creates another 'dist' folder
```

### Step 2: Create Deployment Package

```bash
# Go back to root
cd ..

# Create a deployment package
mkdir -p deployment-package
cp -r frontend-practice/dist deployment-package/practice
cp -r frontend-quiz-parser/dist deployment-package/parser
cp nginx-cyez.conf deployment-package/

# Create a tar file for easy transfer
tar -czf deployment.tar.gz deployment-package/
```

Now you have `deployment.tar.gz` containing:
- `practice/` - Built practice app
- `parser/` - Built parser app  
- `nginx-cyez.conf` - Nginx configuration

## 📤 Part 2: Transfer Files to VM

Choose one of these methods:

### Option A: Upload via Cloud Storage
1. Upload `deployment.tar.gz` to Google Drive, Dropbox, or any cloud storage
2. Get a shareable download link
3. On the VM, download it:
```bash
wget "your-download-link" -O deployment.tar.gz
# or
curl -L "your-download-link" -o deployment.tar.gz
```

### Option B: Use SCP from Another Machine
If you can SCP from another machine that has SSH access:
```bash
scp deployment.tar.gz user@vm-ip:/tmp/
```

### Option C: Use File Transfer Tool
Use FileZilla, WinSCP, or similar to upload the file to the VM

## 🖥️ Part 3: Deploy on the VM

Now, log into your VM and run these commands:

### Step 1: Install Required Software

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install nginx
sudo apt install nginx -y

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 2: Extract and Deploy Files

```bash
# Go to where you uploaded the file (e.g., /tmp or home directory)
cd ~

# Extract the deployment package
tar -xzf deployment.tar.gz
cd deployment-package

# Create web directories
sudo mkdir -p /var/www/kedge-practice
sudo mkdir -p /var/www/kedge-quiz-parser

# Copy files to web directories
sudo cp -r practice/* /var/www/kedge-practice/
sudo cp -r parser/* /var/www/kedge-quiz-parser/

# Set proper ownership
sudo chown -R www-data:www-data /var/www/kedge-practice
sudo chown -R www-data:www-data /var/www/kedge-quiz-parser

# Set proper permissions
sudo chmod -R 755 /var/www/kedge-practice
sudo chmod -R 755 /var/www/kedge-quiz-parser
```

### Step 3: Configure Nginx

```bash
# Copy nginx configuration
sudo cp nginx-cyez.conf /etc/nginx/sites-available/cyez

# Enable the site
sudo ln -s /etc/nginx/sites-available/cyez /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Edit the configuration to set your backend URL
sudo nano /etc/nginx/sites-available/cyez
```

In the nginx config, find and update this line (around line 57):
```nginx
proxy_pass http://localhost:8718;  # Change to your backend URL
```

Change it to your actual backend server:
- If backend is on same VM: `http://localhost:8718`
- If backend is elsewhere: `http://your-backend-ip:8718`

Save and exit (Ctrl+X, then Y, then Enter).

```bash
# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

### Step 4: Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH if needed

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

### Step 5: Set Up SSL Certificate

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d cyez.zhushou.one

# Follow the prompts:
# - Enter email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)
```

## ✅ Verification

Test your deployment:

```bash
# Check if nginx is running
sudo systemctl status nginx

# Check if files are in place
ls -la /var/www/kedge-practice/
ls -la /var/www/kedge-quiz-parser/

# Test locally on the VM
curl -I http://localhost
curl -I http://localhost/parser

# Check nginx logs for errors
sudo tail -f /var/log/nginx/error.log
```

From a browser, visit:
- `http://cyez.zhushou.one` - Should show practice app
- `http://cyez.zhushou.one/parser` - Should show parser app

## 🔧 Troubleshooting

### If sites don't load:

1. **Check nginx is running:**
```bash
sudo systemctl status nginx
```

2. **Check nginx config:**
```bash
sudo nginx -t
```

3. **Check file permissions:**
```bash
ls -la /var/www/
# Should be owned by www-data
```

4. **Check nginx error log:**
```bash
sudo tail -n 50 /var/log/nginx/error.log
```

### If API calls fail:

1. **Check backend URL in nginx config:**
```bash
sudo nano /etc/nginx/sites-available/cyez
# Look for proxy_pass line
```

2. **Test backend directly:**
```bash
curl http://localhost:8718/v1/health
```

3. **Check CORS settings on backend**

### If /parser shows 404:

1. **Check nginx config has the /parser location block**
2. **Verify files exist:**
```bash
ls /var/www/kedge-quiz-parser/index.html
```

## 🔄 Updating the Apps

When you need to update:

1. **Build new versions locally**
2. **Create new deployment package**
3. **Transfer to VM**
4. **On VM:**
```bash
# Extract new files
tar -xzf deployment.tar.gz

# Backup old files (optional)
sudo cp -r /var/www/kedge-practice /var/www/kedge-practice.bak
sudo cp -r /var/www/kedge-quiz-parser /var/www/kedge-quiz-parser.bak

# Deploy new files
sudo cp -r deployment-package/practice/* /var/www/kedge-practice/
sudo cp -r deployment-package/parser/* /var/www/kedge-quiz-parser/

# Fix permissions
sudo chown -R www-data:www-data /var/www/kedge-practice
sudo chown -R www-data:www-data /var/www/kedge-quiz-parser

# No need to restart nginx for static files
```

## 📝 Quick Command Reference

```bash
# Nginx commands
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo systemctl status nginx

# Test config
sudo nginx -t

# View logs
sudo tail -f /var/log/nginx/cyez-access.log
sudo tail -f /var/log/nginx/cyez-error.log

# Check disk space
df -h

# Check memory
free -h

# List running processes
ps aux | grep nginx

# Check ports
sudo netstat -tlnp
```

## 🎉 Done!

Your apps should now be accessible at:
- **Practice App**: https://cyez.zhushou.one
- **Parser App**: https://cyez.zhushou.one/parser