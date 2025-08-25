# 🚀 VM Deployment Quick Reference

## 📦 On Your Local Machine

```bash
# Build and package everything
./prepare-deployment.sh

# This creates: deployment.tar.gz
```

## 📤 Transfer to VM
Choose one method:

### Option 1: Cloud Storage
1. Upload `deployment.tar.gz` to Google Drive/Dropbox
2. Get shareable link
3. On VM: `wget "link" -O deployment.tar.gz`

### Option 2: USB Drive
1. Copy `deployment.tar.gz` to USB
2. Mount USB on VM
3. Copy file from USB

### Option 3: Python HTTP Server (if on same network)
```bash
# On local machine:
python3 -m http.server 8000

# On VM:
wget http://your-local-ip:8000/deployment.tar.gz
```

## 🖥️ On the VM

### First-Time Setup
```bash
# 1. Install nginx (if not installed)
sudo apt update
sudo apt install nginx -y

# 2. Extract and deploy
tar -xzf deployment.tar.gz
cd deployment-package
./setup-on-vm.sh

# 3. Configure backend URL
sudo nano /etc/nginx/sites-available/cyez
# Find: proxy_pass http://localhost:8718
# Change to your backend URL

# 4. Test and reload
sudo nginx -t
sudo systemctl reload nginx

# 5. Setup SSL (optional but recommended)
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d cyez.zhushou.one
```

### Update Deployment
```bash
# Extract new package
tar -xzf deployment.tar.gz
cd deployment-package

# Backup old files (optional)
sudo cp -r /var/www/kedge-practice /var/www/kedge-practice.bak
sudo cp -r /var/www/kedge-quiz-parser /var/www/kedge-quiz-parser.bak

# Deploy new files
sudo cp -r practice/* /var/www/kedge-practice/
sudo cp -r parser/* /var/www/kedge-quiz-parser/

# Fix permissions
sudo chown -R www-data:www-data /var/www/kedge-practice
sudo chown -R www-data:www-data /var/www/kedge-quiz-parser
```

## 🔍 Verification

```bash
# Check nginx status
sudo systemctl status nginx

# Check files exist
ls -la /var/www/kedge-practice/
ls -la /var/www/kedge-quiz-parser/

# Test locally
curl -I http://localhost
curl -I http://localhost/parser

# View logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/cyez-access.log
```

## 🔧 Troubleshooting

### Sites don't load
```bash
# Check nginx config
sudo nginx -t

# Check file permissions
ls -la /var/www/
# Should be owned by www-data
```

### API calls fail
```bash
# Check backend URL in nginx
sudo nano /etc/nginx/sites-available/cyez

# Test backend directly
curl http://localhost:8718/v1/health
```

### Parser shows 404
```bash
# Verify files exist
ls /var/www/kedge-quiz-parser/index.html

# Check nginx has /parser location block
sudo nano /etc/nginx/sites-available/cyez
```

## 📍 URLs
- **Practice App**: https://cyez.zhushou.one
- **Parser App**: https://cyez.zhushou.one/parser
- **API**: https://cyez.zhushou.one/v1/

## 💡 Tips
- Always test nginx config before reloading: `sudo nginx -t`
- Keep backups before updating: `cp -r /var/www /var/www.bak`
- Monitor logs during deployment: `sudo tail -f /var/log/nginx/error.log`
- Use `df -h` to check disk space
- Use `free -h` to check memory