# Deployment Guide for cyez.edunest.cn

## Server Info
- **Server IP**: 47.99.175.26
- **Domain**: cyez.edunest.cn
- **Backend Port**: 8718

## Quick Deployment

### 1. Build and Deploy Frontend
```bash
# On local machine
./prepare-deployment-cyez-edunest.sh

# Transfer to server
scp deployment-cyez-edunest.tar.gz root@47.99.175.26:/tmp/

# On server
ssh root@47.99.175.26
cd /tmp && tar -xzf deployment-cyez-edunest.tar.gz
cd deployment-package && sudo ./setup-on-server.sh
```

### 2. Build and Deploy Backend
```bash
# On server
cd /root/kedge-self-practice/backend
git pull
pnpm install
npx nx build api-server --configuration=production
source .envrc
pm2 delete kedge-api-server 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
```

## SSL Certificate (Let's Encrypt)

### Initial Setup
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot certonly --nginx -d cyez.edunest.cn
```

### Certificate Locations
```
/etc/letsencrypt/live/cyez.edunest.cn/fullchain.pem  # Certificate
/etc/letsencrypt/live/cyez.edunest.cn/privkey.pem    # Private key
```

### Nginx SSL Config
```nginx
ssl_certificate /etc/letsencrypt/live/cyez.edunest.cn/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/cyez.edunest.cn/privkey.pem;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```

### Renew Certificate
```bash
# Manual renewal
sudo certbot renew --cert-name cyez.edunest.cn

# Check certificate status
sudo certbot certificates
```

### Auto-Renewal (Cron Job)
```bash
# Add cron job for auto-renewal (runs twice daily)
echo "0 0,12 * * * root certbot renew --cert-name cyez.edunest.cn --quiet" | sudo tee /etc/cron.d/certbot-renew
```

## Troubleshooting

### Certificate Expired
```bash
# Renew certificate
sudo certbot renew --cert-name cyez.edunest.cn

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

### Check Certificate Dates
```bash
# Check file certificate
sudo openssl x509 -in /etc/letsencrypt/live/cyez.edunest.cn/fullchain.pem -noout -dates

# Check live certificate being served
echo | openssl s_client -connect cyez.edunest.cn:443 2>/dev/null | openssl x509 -noout -dates
```

### Backend Not Starting
```bash
# Check PM2 logs
pm2 logs kedge-api-server

# Check if .env was generated
cat .env | head -20

# Regenerate .env
source .envrc
```

### 502 Bad Gateway
```bash
# Check backend is running
pm2 status

# Check backend port
curl http://localhost:8718/v1/health

# Check nginx config
sudo nginx -t
```

## URL Structure
- **Student Practice App**: https://cyez.edunest.cn/
- **Teacher Quiz Parser**: https://cyez.edunest.cn/parser
- **API**: https://cyez.edunest.cn/v1/
- **Swagger**: https://cyez.edunest.cn/swagger-ui
