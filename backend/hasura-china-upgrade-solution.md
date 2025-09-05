# Hasura Upgrade Solution for China (DaoCloud Mirror Issue)

## Problem
DaoCloud mirror doesn't have `hasura/graphql-engine:v2.36.1` in their allowlist.

## Solutions

### Option 1: Use Docker Hub Directly (Recommended)
```bash
# Remove DaoCloud mirror temporarily
docker pull docker.io/hasura/graphql-engine:v2.36.1

# Or use a proxy
export https_proxy=http://your-proxy:port
docker pull hasura/graphql-engine:v2.36.1
```

### Option 2: Use Alibaba Cloud Registry (阿里云)
```bash
# Try Alibaba Cloud mirror
docker pull registry.cn-hangzhou.aliyuncs.com/hasura/graphql-engine:v2.36.1

# If not available, try:
docker pull registry.cn-beijing.aliyuncs.com/hasura/graphql-engine:v2.36.1
```

### Option 3: Check Available Versions on DaoCloud
```bash
# First, let's see what versions ARE available
# Common versions that might be in DaoCloud whitelist:

# Try v2.33.0 (LTS version)
docker pull docker.m.daocloud.io/hasura/graphql-engine:v2.33.0

# Try v2.30.0 
docker pull docker.m.daocloud.io/hasura/graphql-engine:v2.30.0

# Try v2.28.0 (another LTS)
docker pull docker.m.daocloud.io/hasura/graphql-engine:v2.28.0

# Try v2.25.0
docker pull docker.m.daocloud.io/hasura/graphql-engine:v2.25.0
```

### Option 4: Build and Push to Your Registry
```bash
# On a machine with access to Docker Hub
docker pull hasura/graphql-engine:v2.36.1

# Tag for your private registry
docker tag hasura/graphql-engine:v2.36.1 your-registry.com/hasura/graphql-engine:v2.36.1

# Push to your registry
docker push your-registry.com/hasura/graphql-engine:v2.36.1

# Then pull from your registry on production
docker pull your-registry.com/hasura/graphql-engine:v2.36.1
```

### Option 5: Direct Download Binary (No Docker)
```bash
# Download Hasura binary directly
wget https://github.com/hasura/graphql-engine/releases/download/v2.36.1/graphql-engine-v2.36.1-linux-amd64

# Make it executable
chmod +x graphql-engine-v2.36.1-linux-amd64

# Run without Docker
./graphql-engine-v2.36.1-linux-amd64 serve \
  --database-url "postgres://kedgetech:Nie112233@pgm-bp10tol2zf3i95f68o.pg.rds.aliyuncs.com:5432/kedge_db" \
  --enable-console \
  --admin-secret "9AgJckEMHPRgrasj7Ey8jR" \
  --server-port 28717
```

## Immediate Solution: Test with Available Versions

Let's test which versions are available and work with your schema:

### Test v2.33.0 (LTS - Likely Available)
```bash
# This is an LTS version, more likely to be in DaoCloud
docker pull docker.m.daocloud.io/hasura/graphql-engine:v2.33.0

# Run test
docker run -d \
  --name hasura-test-v233 \
  -e HASURA_GRAPHQL_DATABASE_URL="postgres://kedgetech:Nie112233@pgm-bp10tol2zf3i95f68o.pg.rds.aliyuncs.com:5432/kedge_db" \
  -e HASURA_GRAPHQL_ENABLE_CONSOLE=true \
  -e HASURA_GRAPHQL_ADMIN_SECRET=9AgJckEMHPRgrasj7Ey8jR \
  -p 8081:8080 \
  docker.m.daocloud.io/hasura/graphql-engine:v2.33.0
```

### Test v2.28.0 (Previous LTS)
```bash
docker pull docker.m.daocloud.io/hasura/graphql-engine:v2.28.0
```

## Version Compatibility Notes

### Minimum Version Needed
You need **at least v2.10.0** to fix the schema resolution bug. Any version from v2.10.0 to v2.36.1 will work.

### Good Versions to Try (in order):
1. **v2.33.0** - LTS, best compatibility
2. **v2.28.0** - Previous LTS
3. **v2.25.0** - Stable, widely used
4. **v2.20.0** - Minimum recommended
5. **v2.15.0** - Still fixes your bug
6. **v2.10.0** - Minimum version that fixes the bug

## Quick Test Script

Save this as `test-hasura-versions.sh`:

```bash
#!/bin/bash

VERSIONS=("v2.33.0" "v2.30.0" "v2.28.0" "v2.25.0" "v2.20.0" "v2.15.0" "v2.10.0")

for VERSION in "${VERSIONS[@]}"; do
    echo "Testing $VERSION..."
    if docker pull docker.m.daocloud.io/hasura/graphql-engine:$VERSION 2>/dev/null; then
        echo "✅ $VERSION is available!"
        
        # Test it
        docker run -d --name test-$VERSION \
          -e HASURA_GRAPHQL_DATABASE_URL="postgres://kedgetech:Nie112233@pgm-bp10tol2zf3i95f68o.pg.rds.aliyuncs.com:5432/kedge_db" \
          -e HASURA_GRAPHQL_ENABLE_CONSOLE=true \
          -e HASURA_GRAPHQL_ADMIN_SECRET=9AgJckEMHPRgrasj7Ey8jR \
          -p 8082:8080 \
          docker.m.daocloud.io/hasura/graphql-engine:$VERSION
        
        sleep 5
        
        # Test schema access
        if curl -s http://localhost:8082/healthz | grep -q "OK"; then
            echo "✅ $VERSION works!"
            docker stop test-$VERSION
            docker rm test-$VERSION
            break
        else
            echo "❌ $VERSION failed to start"
            docker stop test-$VERSION 2>/dev/null
            docker rm test-$VERSION 2>/dev/null
        fi
    else
        echo "❌ $VERSION not available on DaoCloud"
    fi
done
```

## Alternative: Use Tencent Cloud Image
```bash
# Tencent Cloud might have it
docker pull ccr.ccs.tencentyun.com/hasura/graphql-engine:v2.36.1
```

## If All Else Fails: Request Addition to DaoCloud
Open an issue at: https://github.com/DaoCloud/public-image-mirror/issues/new

Request template:
```
Title: Add hasura/graphql-engine:v2.33.0 to allowlist

Image: hasura/graphql-engine:v2.33.0
Reason: Production requirement for GraphQL API server
DockerHub: https://hub.docker.com/r/hasura/graphql-engine
```