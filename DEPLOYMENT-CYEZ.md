# 🚀 Deployment Guide for cyez.zhushou.one

This guide is specifically for deploying to `cyez.zhushou.one` with both frontends.

## 📍 URL Structure

- **Student Practice App**: `https://cyez.zhushou.one/`
- **Teacher Quiz Parser**: `https://cyez.zhushou.one/parser`
- **Backend API**: Proxied through `/v1/*`

## 🎯 Quick Deployment

### One-Command Deploy (After Initial Setup)
```bash
./deploy-cyez.sh user@your-server-ip
```

## 📋 Initial Setup Steps

### 1️⃣ Server Preparation
```bash
# SSH into your server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install nginx
sudo apt install nginx -y

# Install Node.js (if building on server)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2️⃣ Configure DNS
Point `cyez.zhushou.one` to your server IP address in your DNS settings.

### 3️⃣ Deploy Applications
From your local machine:
```bash
# Clone if you haven't
git clone [your-repo]
cd kedge-self-practice

# Run the deployment script
./deploy-cyez.sh user@your-server-ip
```

### 4️⃣ Configure Backend Connection
SSH into your server and edit the nginx config:
```bash
sudo nano /etc/nginx/sites-available/cyez
```

Find this line and update with your backend server:
```nginx
proxy_pass http://localhost:8718;  # Change to your backend URL
```

For example, if your backend is on a different server:
```nginx
proxy_pass http://backend.server.ip:8718;
```

### 5️⃣ SSL Certificate Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d cyez.zhushou.one

# Test auto-renewal
sudo certbot renew --dry-run
```

### 6️⃣ Firewall Configuration
```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## 🔧 Important Configuration

### Quiz Parser Base Path
The quiz parser needs to know it's served from `/parser`. 

Before building, ensure `frontend-quiz-parser/vite.config.ts` has:
```javascript
export default defineConfig({
  base: '/parser/',  // Important!
  // ... rest of config
})
```

### Environment Variables
Create `.env.production` files before building:

**frontend-practice/.env.production**
```env
VITE_API_BASE_URL=https://cyez.zhushou.one
```

**frontend-quiz-parser/.env.production**
```env
VITE_API_BASE_URL=https://cyez.zhushou.one
```

## 🔄 Updating Applications

### Update Both Apps
```bash
./deploy-cyez.sh user@your-server-ip
```

### Update Manually
```bash
# Build practice app
cd frontend-practice
npm run build
rsync -avz --delete dist/ user@server:/var/www/kedge-practice/

# Build parser app (with base path)
cd ../frontend-quiz-parser
npm run build  # Make sure vite.config has base: '/parser/'
rsync -avz --delete dist/ user@server:/var/www/kedge-quiz-parser/

# Fix permissions on server
ssh user@server "sudo chown -R www-data:www-data /var/www/"
```

## 📊 Monitoring

### Check Status
```bash
# Nginx status
sudo systemctl status nginx

# Check if sites are up
curl -I https://cyez.zhushou.one
curl -I https://cyez.zhushou.one/parser

# View logs
sudo tail -f /var/log/nginx/cyez-access.log
sudo tail -f /var/log/nginx/cyez-error.log
```

### Common Issues & Solutions

#### Parser App Shows 404
**Solution**: Ensure nginx config has:
```nginx
location /parser {
    alias /var/www/kedge-quiz-parser;
    try_files $uri $uri/ /parser/index.html;
}
```

#### API Calls Failing
**Solutions**:
1. Check backend is running
2. Verify proxy_pass URL in nginx
3. Check CORS settings on backend
4. Look at nginx error logs

#### Assets Not Loading in Parser
**Solution**: Rebuild with `base: '/parser/'` in vite.config.ts

#### Large File Upload Fails
**Solution**: Nginx config already has `client_max_body_size 50M;`

## 🔐 Security Checklist

- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] SSH key-only authentication
- [ ] Regular system updates scheduled
- [ ] Backend API secured
- [ ] Nginx security headers configured

## 📝 File Structure on Server

```
/var/www/
├── kedge-practice/          # Student practice app
│   ├── index.html
│   ├── assets/
│   └── ...
└── kedge-quiz-parser/       # Teacher parser app
    ├── index.html
    ├── assets/
    └── ...

/etc/nginx/sites-available/
└── cyez                     # Nginx config

/var/log/nginx/
├── cyez-access.log
└── cyez-error.log
```

## 🆘 Troubleshooting Commands

```bash
# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check file permissions
ls -la /var/www/

# Fix permissions
sudo chown -R www-data:www-data /var/www/
sudo chmod -R 755 /var/www/

# Check if backend is accessible
curl http://localhost:8718/v1/health

# Check SSL certificate
sudo certbot certificates

# View real-time logs
sudo journalctl -f -u nginx
```

## 📞 Quick Reference

- **Main Site**: https://cyez.zhushou.one
- **Parser**: https://cyez.zhushou.one/parser
- **API Endpoint**: https://cyez.zhushou.one/v1/
- **Health Check**: https://cyez.zhushou.one/health

## 🎉 Verification

After deployment, verify:
1. ✅ https://cyez.zhushou.one loads the practice app
2. ✅ https://cyez.zhushou.one/parser loads the parser app
3. ✅ API calls work (check browser network tab)
4. ✅ SSL padlock shows in browser
5. ✅ Large file uploads work in parser (test with a DOCX file)