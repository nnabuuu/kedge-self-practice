# Docker Deployment Guide for Kedge Backend

This guide explains how to build and deploy the Kedge backend using Docker with external environment configuration.

## Quick Start

```bash
# 1. Create config directory outside the repository
mkdir -p ../config

# 2. Copy and customize environment file
cp .env.docker.example ../config/.env
# Edit ../config/.env with your actual values

# 3. Build the Docker image
docker build -f Dockerfile.backend -t kedge-backend:latest .

# 4. Run with docker-compose
docker-compose -f docker-compose.backend.yaml up -d
```

## Environment Configuration Methods

The Docker setup supports multiple ways to provide environment variables, listed in order of precedence (later overrides earlier):

### Method 1: External .env File (Recommended for Local Development)

Create a `.env` file outside your repository to keep sensitive data secure:

```bash
# Create config directory at parent level
mkdir -p ../config

# Copy example and edit
cp .env.docker.example ../config/.env
nano ../config/.env
```

Then run with:
```bash
docker-compose -f docker-compose.backend.yaml up -d
```

### Method 2: Multiple Environment Files

You can layer multiple environment files for different configurations:

```bash
# Base configuration
echo "NODE_ENV=production" > ../config/.env.base

# Local overrides
echo "LOG_LEVEL=debug" > ../config/.env.local

# Secret values
echo "JWT_SECRET=super-secret-key" > ../config/.env.secrets
```

Update `docker-compose.backend.yaml`:
```yaml
env_file:
  - ../config/.env.base
  - ../config/.env.local
  - ../config/.env.secrets
```

### Method 3: Direct Environment Variables

Pass environment variables directly when running:

```bash
# Using docker run
docker run -d \
  -e NODE_DATABASE_URL="postgres://user:pass@host:5432/db" \
  -e REDIS_HOST="redis.example.com" \
  -e JWT_SECRET="your-secret" \
  -p 8718:8718 \
  kedge-backend:latest

# Using docker-compose with .env file in current directory
NODE_DATABASE_URL="postgres://user:pass@host:5432/db" \
REDIS_HOST="redis.example.com" \
docker-compose -f docker-compose.backend.yaml up -d

# Or export them first
export NODE_DATABASE_URL="postgres://user:pass@host:5432/db"
export REDIS_HOST="redis.example.com"
docker-compose -f docker-compose.backend.yaml up -d
```

### Method 4: Docker Secrets (Production/Swarm)

For production deployments using Docker Swarm:

```bash
# Create secrets
echo "your-jwt-secret" | docker secret create jwt_secret -
echo "your-db-password" | docker secret create db_password -
echo "your-openai-key" | docker secret create openai_api_key -

# Deploy stack
docker stack deploy -c docker-compose.backend.yaml kedge
```

### Method 5: Kubernetes ConfigMap/Secrets

For Kubernetes deployments:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: kedge-config
data:
  NODE_ENV: "production"
  API_PORT: "8718"
---
apiVersion: v1
kind: Secret
metadata:
  name: kedge-secrets
type: Opaque
stringData:
  NODE_DATABASE_URL: "postgres://user:pass@host:5432/db"
  JWT_SECRET: "your-secret-key"
```

## Custom Configuration Directory

You can specify a custom configuration directory:

```bash
# Set custom config directory
CONFIG_DIR=/path/to/your/config docker-compose -f docker-compose.backend.yaml up -d

# Or export it
export CONFIG_DIR=/path/to/your/config
docker-compose -f docker-compose.backend.yaml up -d
```

## Building the Image

### Development Build

```bash
# Build with development dependencies
docker build -f Dockerfile.backend --target builder -t kedge-backend:dev .
```

### Production Build

```bash
# Build optimized production image
docker build -f Dockerfile.backend -t kedge-backend:latest .

# Build with specific build args
docker build -f Dockerfile.backend \
  --build-arg NODE_ENV=production \
  --build-arg API_PORT=8718 \
  -t kedge-backend:latest .
```

### Multi-platform Build

```bash
# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f Dockerfile.backend \
  -t kedge-backend:latest \
  --push .
```

## Running the Container

### Standalone Container

```bash
# Run with external .env file
docker run -d \
  --name kedge-api \
  -v $(pwd)/../config:/config:ro \
  -v $(pwd)/storage:/app/storage \
  -v $(pwd)/logs:/app/logs \
  -p 8718:8718 \
  kedge-backend:latest

# Run with inline environment variables
docker run -d \
  --name kedge-api \
  -e NODE_DATABASE_URL="postgres://localhost:5432/kedge" \
  -e REDIS_HOST="localhost" \
  -e JWT_SECRET="secret" \
  -p 8718:8718 \
  kedge-backend:latest
```

### Docker Compose Stack

```bash
# Start all services
docker-compose -f docker-compose.backend.yaml up -d

# Start only API server (assuming deps are running elsewhere)
docker-compose -f docker-compose.backend.yaml up -d api-server

# View logs
docker-compose -f docker-compose.backend.yaml logs -f api-server

# Stop services
docker-compose -f docker-compose.backend.yaml down

# Stop and remove volumes
docker-compose -f docker-compose.backend.yaml down -v
```

## Volume Mounts

The following directories can be mounted as volumes:

| Container Path | Purpose | Mount Type |
|---------------|---------|------------|
| `/config` | Environment configuration files | Read-only |
| `/app/storage` | General file storage | Read-write |
| `/app/logs` | Application logs | Read-write |
| `/app/quiz-storage` | Quiz attachments and images | Read-write |
| `/app/uploads` | Temporary file uploads | Read-write |

Example with custom paths:

```bash
docker run -d \
  -v /opt/kedge/config:/config:ro \
  -v /var/lib/kedge/storage:/app/storage \
  -v /var/log/kedge:/app/logs \
  -v /var/lib/kedge/quiz:/app/quiz-storage \
  -v /tmp/kedge/uploads:/app/uploads \
  kedge-backend:latest
```

## Health Checks

The container includes health checks that verify:
- API server is responding on the configured port
- Database connection is available
- Redis connection is available

Check health status:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' kedge-api

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' kedge-api
```

## Debugging

### View Logs

```bash
# View container logs
docker logs kedge-api

# Follow logs
docker logs -f kedge-api

# View last 100 lines
docker logs --tail 100 kedge-api
```

### Access Container Shell

```bash
# Execute shell in running container
docker exec -it kedge-api sh

# Run as root for debugging
docker exec -u root -it kedge-api sh
```

### Check Environment Variables

```bash
# View all environment variables
docker exec kedge-api env

# Check specific variable
docker exec kedge-api printenv NODE_DATABASE_URL
```

### Test Connectivity

```bash
# Test API endpoint
curl http://localhost:8718/v1/health

# Test from inside container
docker exec kedge-api curl http://localhost:8718/v1/health
```

## Security Best Practices

1. **Never commit .env files** - Always use `.env.example` for templates
2. **Use secrets management** - Docker Secrets, Kubernetes Secrets, or external vaults
3. **Rotate secrets regularly** - Especially JWT secrets and API keys
4. **Use read-only mounts** - Mount config files as read-only
5. **Run as non-root** - The container runs as user `kedge` (UID 1001)
6. **Limit resources** - Set memory and CPU limits in production
7. **Use specific image tags** - Avoid using `latest` in production

## Troubleshooting

### Missing Environment Variables

If you see "Missing required environment variables" error:

1. Check that your .env file exists and is readable
2. Verify the mount path is correct
3. Ensure variables are exported correctly
4. Check for typos in variable names

### Connection Refused

If the API is not accessible:

1. Check port mapping: `docker ps`
2. Verify the container is running: `docker ps -a`
3. Check logs for startup errors: `docker logs kedge-api`
4. Ensure health check is passing

### Database Connection Issues

1. Verify DATABASE_URL format
2. Check network connectivity between containers
3. Ensure database is running and accessible
4. Verify credentials are correct

### Permission Denied

If you see permission errors:

1. Ensure mounted volumes have correct permissions
2. The container runs as UID 1001 (kedge user)
3. Set ownership: `chown -R 1001:1001 /path/to/volume`

## Advanced Configuration

### Custom Entrypoint Script

Create a custom entrypoint script:

```bash
docker run -d \
  -v $(pwd)/custom-entrypoint.sh:/app/custom-entrypoint.sh:ro \
  --entrypoint /app/custom-entrypoint.sh \
  kedge-backend:latest
```

### Resource Limits

Set memory and CPU limits:

```bash
docker run -d \
  --memory="1g" \
  --memory-swap="2g" \
  --cpus="1.5" \
  kedge-backend:latest
```

### Network Configuration

Use custom network:

```bash
# Create network
docker network create kedge-net

# Run with custom network
docker run -d \
  --network kedge-net \
  --network-alias api \
  kedge-backend:latest
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build and push Docker image
  run: |
    docker build -f Dockerfile.backend -t kedge-backend:${{ github.sha }} .
    docker tag kedge-backend:${{ github.sha }} kedge-backend:latest
    docker push kedge-backend:${{ github.sha }}
    docker push kedge-backend:latest
```

### GitLab CI Example

```yaml
docker-build:
  stage: build
  script:
    - docker build -f Dockerfile.backend -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

## Monitoring

### Prometheus Metrics

If metrics are enabled, they're available at:
```
http://localhost:8718/metrics
```

### Health Endpoint

```bash
curl http://localhost:8718/v1/health
```

### Ready Endpoint

```bash
curl http://localhost:8718/v1/ready
```

## Migration from Existing Setup

If migrating from the existing setup:

1. Export current environment variables
2. Create new .env file with exported values
3. Build new Docker image
4. Test with docker-compose
5. Migrate data if needed
6. Switch to new deployment

## Support

For issues or questions:
1. Check logs: `docker logs kedge-api`
2. Verify environment variables are set correctly
3. Ensure all required services are running
4. Check health endpoints
5. Review this documentation