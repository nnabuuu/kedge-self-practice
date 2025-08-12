# 🚀 Deployment Guide - Kedge Self Practice Platform

Complete deployment guide for the kedge-self-practice learning platform including backend API, frontend applications, and infrastructure setup.

## 📋 Table of Contents

- [🏗️ Architecture Overview](#architecture-overview)
- [🔧 Prerequisites](#prerequisites)
- [🐳 Docker Deployment (Recommended)](#docker-deployment-recommended)
- [☁️ Cloud Deployment](#cloud-deployment)
- [🖥️ Manual Deployment](#manual-deployment)
- [🔒 Environment Configuration](#environment-configuration)
- [📊 Monitoring & Maintenance](#monitoring--maintenance)
- [🔧 Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview

```mermaid
graph TD
    A[Load Balancer/Reverse Proxy] --> B[Frontend Practice App]
    A --> C[Frontend Quiz Parser]
    A --> D[Backend API Server]
    D --> E[PostgreSQL Database]
    D --> F[Redis Cache]
    D --> G[File Storage]
    H[Hasura GraphQL] --> E
```

### Components
- **Backend API**: NestJS server (Port 8718)
- **Frontend Practice**: React app for students (Port 5174)
- **Frontend Quiz Parser**: React app for teachers (Port 5173)
- **PostgreSQL**: Database (Port 7543)
- **Redis**: Cache (Port 6379)
- **Hasura**: GraphQL engine (Port 28717)

## 🔧 Prerequisites

### System Requirements
- **Server**: 2+ CPU cores, 4GB+ RAM, 50GB+ storage
- **Node.js**: v18+ (for backend and builds)
- **Docker**: v20+ with Docker Compose
- **SSL Certificate**: For HTTPS (Let's Encrypt recommended)

### Domain Configuration
```
# Example domains
api.yourdomain.com      -> Backend API
practice.yourdomain.com -> Frontend Practice App
parser.yourdomain.com   -> Frontend Quiz Parser
admin.yourdomain.com    -> Hasura Console (optional)
```

## 🐳 Docker Deployment (Recommended)

### 1. Create Docker Compose Configuration

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15
    container_name: kedge-postgres
    environment:
      POSTGRES_DB: kedge_practice
      POSTGRES_USER: kedge_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/packages/dev/database/schema/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kedge_user -d kedge_practice"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: kedge-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Hasura GraphQL Engine
  hasura:
    image: hasura/graphql-engine:v2.36.0
    container_name: kedge-hasura
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "28717:8080"
    environment:
      HASURA_GRAPHQL_METADATA_DATABASE_URL: postgresql://kedge_user:${DB_PASSWORD}@postgres:5432/kedge_practice
      PG_DATABASE_URL: postgresql://kedge_user:${DB_PASSWORD}@postgres:5432/kedge_practice
      HASURA_GRAPHQL_ENABLE_CONSOLE: "false"
      HASURA_GRAPHQL_DEV_MODE: "false"
      HASURA_GRAPHQL_ENABLED_LOG_TYPES: startup, http-log, webhook-log, websocket-log, query-log
      HASURA_GRAPHQL_ADMIN_SECRET: ${HASURA_ADMIN_SECRET}
      HASURA_GRAPHQL_UNAUTHORIZED_ROLE: anonymous
    restart: unless-stopped

  # Backend API Server
  api-server:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: kedge-api
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "8718:8718"
    environment:
      NODE_ENV: production
      API_PORT: 8718
      NODE_DATABASE_URL: postgresql://kedge_user:${DB_PASSWORD}@postgres:5432/kedge_practice
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      QUIZ_STORAGE_PATH: /app/storage
      HASURA_ENDPOINT: http://hasura:8080
      HASURA_ADMIN_SECRET: ${HASURA_ADMIN_SECRET}
    volumes:
      - quiz_storage:/app/storage
      - quiz_logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8718/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend Practice App
  frontend-practice:
    build:
      context: ./frontend-practice
      dockerfile: Dockerfile.prod
      args:
        VITE_API_BASE_URL: https://api.yourdomain.com/api/v1
        VITE_QUIZ_PARSER_URL: https://parser.yourdomain.com
    container_name: kedge-practice
    ports:
      - "5174:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend Quiz Parser
  frontend-quiz-parser:
    build:
      context: ./frontend-quiz-parser
      dockerfile: Dockerfile.prod
      args:
        VITE_API_BASE_URL: https://api.yourdomain.com/api/v1
    container_name: kedge-parser
    ports:
      - "5173:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: kedge-nginx
    depends_on:
      - api-server
      - frontend-practice
      - frontend-quiz-parser
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  quiz_storage:
  quiz_logs:
  nginx_logs:

networks:
  default:
    name: kedge_network
```

### 2. Create Dockerfiles

**Backend Dockerfile** (`backend/Dockerfile.prod`):

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm nx build api-server --prod

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/packages ./packages

# Create storage directories
RUN mkdir -p /app/storage /app/logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S kedge -u 1001
RUN chown -R kedge:nodejs /app
USER kedge

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8718/api/v1/health || exit 1

EXPOSE 8718

CMD ["node", "dist/packages/apps/api-server/main.js"]
```

**Frontend Practice Dockerfile** (`frontend-practice/Dockerfile.prod`):

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build arguments
ARG VITE_API_BASE_URL
ARG VITE_QUIZ_PARSER_URL

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_QUIZ_PARSER_URL=$VITE_QUIZ_PARSER_URL

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Frontend Quiz Parser Dockerfile** (`frontend-quiz-parser/Dockerfile.prod`):

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build arguments
ARG VITE_API_BASE_URL

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the application
RUN npm run build

# Production stage  
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream api_backend {
        server api-server:8718;
    }

    upstream practice_frontend {
        server frontend-practice:80;
    }

    upstream parser_frontend {
        server frontend-quiz-parser:80;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=uploads:10m rate=2r/s;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # API Server
    server {
        listen 80;
        server_name api.yourdomain.com;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # File uploads (higher limits)
        location /api/v1/docx/ {
            limit_req zone=uploads burst=5 nodelay;
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            client_max_body_size 50M;
            proxy_read_timeout 600s;
            proxy_connect_timeout 75s;
        }

        # Swagger UI
        location /swagger-ui {
            proxy_pass http://api_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Practice Frontend
    server {
        listen 80;
        server_name practice.yourdomain.com;

        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # Gzip for static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            gzip_static on;
        }

        # SPA routing
        location / {
            proxy_pass http://practice_frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Handle SPA routing
            try_files $uri $uri/ /index.html;
        }
    }

    # Quiz Parser Frontend
    server {
        listen 80;
        server_name parser.yourdomain.com;

        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # Gzip for static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            gzip_static on;
        }

        # SPA routing
        location / {
            proxy_pass http://parser_frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Handle SPA routing
            try_files $uri $uri/ /index.html;
        }
    }
}
```

### 4. Environment Configuration

Create `.env.prod`:

```bash
# Database Configuration
DB_PASSWORD=your_secure_db_password_here
POSTGRES_DB=kedge_practice
POSTGRES_USER=kedge_user

# Redis Configuration  
REDIS_PASSWORD=your_secure_redis_password_here
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_chars

# Hasura Configuration
HASURA_ADMIN_SECRET=your_hasura_admin_secret_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Domain Configuration
API_DOMAIN=api.yourdomain.com
PRACTICE_DOMAIN=practice.yourdomain.com
PARSER_DOMAIN=parser.yourdomain.com

# SSL Configuration (if using Let's Encrypt)
LETSENCRYPT_EMAIL=admin@yourdomain.com
```

### 5. SSL Certificate Setup (Let's Encrypt)

Create `setup-ssl.sh`:

```bash
#!/bin/bash

# Install certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificates
sudo certbot --nginx -d api.yourdomain.com
sudo certbot --nginx -d practice.yourdomain.com  
sudo certbot --nginx -d parser.yourdomain.com

# Setup auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 6. Deploy with Docker Compose

```bash
# Clone repository
git clone <your-repo-url>
cd kedge-self-practice

# Setup environment
cp .env.example .env.prod
# Edit .env.prod with your values

# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Check service health
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## ☁️ Cloud Deployment

### AWS Deployment

#### 1. EC2 Instance Setup

```bash
# Launch EC2 instance (t3.medium or larger)
# Ubuntu 22.04 LTS
# Security group: HTTP (80), HTTPS (443), SSH (22)

# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker and Docker Compose
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker ubuntu

# Clone and deploy
git clone <your-repo-url>
cd kedge-self-practice
# Follow Docker deployment steps above
```

#### 2. RDS PostgreSQL Setup

```bash
# Create RDS PostgreSQL instance
# Engine: PostgreSQL 15
# Instance class: db.t3.micro (or larger)
# Storage: 20GB GP2
# Enable automated backups

# Update .env.prod with RDS endpoint
NODE_DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/kedge_practice
```

#### 3. ElastiCache Redis Setup

```bash
# Create ElastiCache Redis cluster
# Engine: Redis 7.x
# Node type: cache.t3.micro
# Enable encryption in transit

# Update .env.prod with Redis endpoint
REDIS_HOST=your-redis-endpoint
REDIS_PORT=6379
```

#### 4. S3 File Storage

```bash
# Create S3 bucket for quiz attachments
aws s3 mb s3://kedge-quiz-storage

# Update backend environment
AWS_S3_BUCKET=kedge-quiz-storage
AWS_REGION=us-east-1
```

### Google Cloud Platform (GCP)

#### 1. Cloud Run Deployment

Create `cloudbuild.yaml`:

```yaml
steps:
  # Build backend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/kedge-api:$BUILD_ID', './backend']

  # Build frontend practice
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/kedge-practice:$BUILD_ID', './frontend-practice']

  # Build frontend parser
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/kedge-parser:$BUILD_ID', './frontend-quiz-parser']

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'kedge-api'
      - '--image'
      - 'gcr.io/$PROJECT_ID/kedge-api:$BUILD_ID'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'

images:
  - 'gcr.io/$PROJECT_ID/kedge-api:$BUILD_ID'
  - 'gcr.io/$PROJECT_ID/kedge-practice:$BUILD_ID' 
  - 'gcr.io/$PROJECT_ID/kedge-parser:$BUILD_ID'
```

#### 2. Cloud SQL PostgreSQL

```bash
# Create Cloud SQL PostgreSQL instance
gcloud sql instances create kedge-postgres \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1

# Create database
gcloud sql databases create kedge_practice \
    --instance=kedge-postgres
```

## 🖥️ Manual Deployment

### 1. Server Setup (Ubuntu/CentOS)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 for process management
npm install -g pm2

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install Redis
sudo apt-get install -y redis-server

# Install Nginx
sudo apt-get install -y nginx
```

### 2. Database Setup

```bash
# Setup PostgreSQL
sudo -u postgres createuser kedge_user
sudo -u postgres createdb kedge_practice
sudo -u postgres psql -c "ALTER USER kedge_user PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kedge_practice TO kedge_user;"

# Run migrations
cd backend
pnpm nx run api-server:migrate
```

### 3. Build and Deploy Applications

```bash
# Clone repository
git clone <your-repo-url>
cd kedge-self-practice

# Build backend
cd backend
pnpm install
pnpm nx build api-server --prod

# Build frontends
cd ../frontend-practice
npm install
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1 npm run build

cd ../frontend-quiz-parser
npm install
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1 npm run build
```

### 4. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'kedge-api',
      script: './dist/packages/apps/api-server/main.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        API_PORT: 8718,
        NODE_DATABASE_URL: 'postgresql://kedge_user:password@localhost:5432/kedge_practice',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        JWT_SECRET: 'your-jwt-secret'
      },
      instances: 2,
      exec_mode: 'cluster',
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '512M'
    }
  ]
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### 5. Nginx Configuration

```bash
# Copy built frontend files
sudo cp -r frontend-practice/dist/* /var/www/practice/
sudo cp -r frontend-quiz-parser/dist/* /var/www/parser/

# Create nginx sites
sudo nano /etc/nginx/sites-available/kedge-practice
# Add configuration similar to Docker version

# Enable sites
sudo ln -s /etc/nginx/sites-available/kedge-practice /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 Environment Configuration

### Production Environment Variables

Create separate environment files for each service:

**Backend (`.env.production`)**:
```bash
NODE_ENV=production
API_PORT=8718
NODE_DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password
JWT_SECRET=your_jwt_secret_32_chars_minimum
OPENAI_API_KEY=your_openai_key
QUIZ_STORAGE_PATH=/app/storage
HASURA_ENDPOINT=http://localhost:28717
HASURA_ADMIN_SECRET=hasura_secret

# Email configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Logging
LOG_LEVEL=info
LOG_FILE=/app/logs/app.log

# File upload limits
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=docx,doc,pdf

# CORS configuration
CORS_ORIGINS=https://practice.yourdomain.com,https://parser.yourdomain.com
```

**Frontend Practice (build-time)**:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_QUIZ_PARSER_URL=https://parser.yourdomain.com
VITE_ENABLE_ANALYTICS=true
VITE_VERSION=1.0.0
```

**Frontend Quiz Parser (build-time)**:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_PRACTICE_APP_URL=https://practice.yourdomain.com
VITE_MAX_FILE_SIZE=50
VITE_SUPPORTED_FORMATS=.docx,.doc
```

### Security Considerations

```bash
# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 24  # For HASURA_ADMIN_SECRET
openssl rand -base64 16  # For REDIS_PASSWORD

# Database security
# - Use strong passwords
# - Enable SSL connections
# - Restrict network access
# - Regular backups

# File permissions
chmod 600 .env.production
chown app:app .env.production

# Firewall setup
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

## 📊 Monitoring & Maintenance

### 1. Health Check Endpoints

```typescript
// Backend health check
GET /api/v1/health
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "storage": "accessible"
  }
}
```

### 2. Logging Setup

```bash
# Centralized logging with ELK stack or similar
# Docker logging driver
docker-compose -f docker-compose.prod.yml \
  --log-driver=json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3

# PM2 logs
pm2 logs
pm2 monit
```

### 3. Backup Strategy

Create `backup.sh`:

```bash
#!/bin/bash

# Database backup
pg_dump -h localhost -U kedge_user kedge_practice | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# File storage backup
tar -czf storage_backup_$(date +%Y%m%d_%H%M%S).tar.gz /app/storage

# Upload to S3 or similar
aws s3 cp backup_*.sql.gz s3://your-backup-bucket/db/
aws s3 cp storage_backup_*.tar.gz s3://your-backup-bucket/files/

# Cleanup old backups (keep last 7 days)
find . -name "backup_*.sql.gz" -mtime +7 -delete
find . -name "storage_backup_*.tar.gz" -mtime +7 -delete
```

Schedule with cron:
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### 4. Monitoring with Docker

```yaml
# Add to docker-compose.prod.yml
  prometheus:
    image: prom/prometheus:latest
    container_name: kedge-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    container_name: kedge-grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin_password
    volumes:
      - grafana_data:/var/lib/grafana
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql
docker-compose logs postgres

# Test connection
psql -h localhost -U kedge_user -d kedge_practice -c "SELECT 1;"

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

#### 2. Redis Connection Issues
```bash
# Check Redis status
sudo systemctl status redis
docker-compose logs redis

# Test connection
redis-cli -h localhost -p 6379 ping
redis-cli -h localhost -p 6379 -a your_password ping
```

#### 3. File Upload Issues
```bash
# Check storage permissions
ls -la /app/storage
chown -R app:app /app/storage
chmod 755 /app/storage

# Check nginx upload limits
grep client_max_body_size /etc/nginx/nginx.conf
```

#### 4. Frontend Build Issues
```bash
# Check Node.js version
node --version  # Should be 18+

# Clean install
rm -rf node_modules package-lock.json
npm install

# Check build environment
echo $VITE_API_BASE_URL
```

#### 5. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew --dry-run
sudo certbot renew

# Check nginx SSL configuration
sudo nginx -t
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_quizzes_subject_id ON quizzes(subject_id);
CREATE INDEX idx_practice_history_user_id ON practice_history(user_id);
CREATE INDEX idx_knowledge_points_subject_id ON knowledge_points(subject_id);

-- Update table statistics
ANALYZE;
```

#### 2. Redis Configuration
```bash
# Optimize Redis memory usage
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli CONFIG SET maxmemory 256mb
```

#### 3. Nginx Optimization
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 1024;

# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Enable caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Scaling Considerations

#### Horizontal Scaling
- **Load Balancer**: Use nginx, HAProxy, or cloud load balancers
- **Database**: Read replicas for PostgreSQL
- **Cache**: Redis cluster for high availability
- **File Storage**: Use cloud storage (S3, GCS) for scalability

#### Vertical Scaling
- **CPU**: Monitor API server CPU usage
- **Memory**: Monitor Node.js heap usage
- **Storage**: Monitor database and file storage growth

---

## 📞 Support & Maintenance

### Deployment Checklist

- [ ] Server setup and hardening
- [ ] Database installation and configuration
- [ ] SSL certificates obtained and configured
- [ ] Environment variables set securely
- [ ] Application builds successful
- [ ] All services running and healthy
- [ ] Domain names pointing to correct servers
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured
- [ ] Documentation updated

### Maintenance Schedule

- **Daily**: Check application logs and health
- **Weekly**: Review performance metrics and resource usage
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Full backup restore testing and security audit

### Getting Help

- **Application Logs**: Check service logs for errors
- **Health Endpoints**: Monitor `/api/v1/health` endpoint
- **Database Logs**: Monitor PostgreSQL and Redis logs
- **System Resources**: Monitor CPU, memory, and disk usage

---

**Happy deploying!** 🚀✨