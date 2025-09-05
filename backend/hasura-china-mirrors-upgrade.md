# Hasura Upgrade Using Chinese Mirrors

## Try These Commands on Your Server (in order of likelihood):

### 1. Tencent Cloud (腾讯云) - Most Likely to Work
```bash
# Try latest LTS
docker pull ccr.ccs.tencentyun.com/hasura/graphql-engine:v2.33.0

# If not found, try without namespace
docker pull ccr.ccs.tencentyun.com/graphql-engine:v2.33.0

# Or try with dockerhub namespace
docker pull ccr.ccs.tencentyun.com/dockerhub/hasura/graphql-engine:v2.33.0
```

### 2. Docker.1ms.run
```bash
docker pull docker.1ms.run/hasura/graphql-engine:v2.33.0

# If v2.33.0 not available, try other versions
docker pull docker.1ms.run/hasura/graphql-engine:v2.30.0
docker pull docker.1ms.run/hasura/graphql-engine:v2.28.0
docker pull docker.1ms.run/hasura/graphql-engine:v2.25.0
```

### 3. Hub.xdark.top
```bash
docker pull hub.xdark.top/hasura/graphql-engine:v2.33.0
```

### 4. Dhub.kubesre.xyz
```bash
docker pull dhub.kubesre.xyz/hasura/graphql-engine:v2.33.0
```

### 5. Docker.kejilion.pro
```bash
docker pull docker.kejilion.pro/hasura/graphql-engine:v2.33.0
```

### 6. Run-docker.cn
```bash
docker pull run-docker.cn/hasura/graphql-engine:v2.33.0
```

## Test Script for Your Server

Save this as `test-mirrors.sh` and run on your server:

```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Test different mirror and version combinations
test_pull() {
    local mirror=$1
    local image=$2
    
    echo -n "Testing ${mirror}/${image}... "
    
    if timeout 30 docker pull ${mirror}/${image} >/dev/null 2>&1; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
        echo "Found working image: ${mirror}/${image}"
        return 0
    else
        echo -e "${RED}❌ Failed${NC}"
        return 1
    fi
}

# Mirrors to test
MIRRORS=(
    "ccr.ccs.tencentyun.com"
    "docker.1ms.run"
    "hub.xdark.top"
    "dhub.kubesre.xyz"
    "docker.kejilion.pro"
    "run-docker.cn"
)

# Versions to try (newest to oldest)
VERSIONS=(
    "v2.33.0"  # LTS
    "v2.30.0"
    "v2.28.0"  # Previous LTS
    "v2.25.0"
    "v2.20.0"
    "v2.15.0"
    "v2.10.0"  # Minimum version that fixes your bug
)

echo "Finding available Hasura images..."
echo "=================================="

for mirror in "${MIRRORS[@]}"; do
    for version in "${VERSIONS[@]}"; do
        if test_pull $mirror "hasura/graphql-engine:$version"; then
            echo ""
            echo "🎉 FOUND WORKING IMAGE!"
            echo "======================"
            echo "Image: ${mirror}/hasura/graphql-engine:${version}"
            echo ""
            echo "Run this to upgrade:"
            echo "docker run -d \\"
            echo "  --name hasura-new \\"
            echo "  --restart=always \\"
            echo "  -p 28717:8080 \\"
            echo "  -e HASURA_GRAPHQL_DATABASE_URL=\"postgres://kedgetech:Nie112233@pgm-bp10tol2zf3i95f68o.pg.rds.aliyuncs.com:5432/kedge_db\" \\"
            echo "  -e HASURA_GRAPHQL_ENABLE_CONSOLE=true \\"
            echo "  -e HASURA_GRAPHQL_ADMIN_SECRET=9AgJckEMHPRgrasj7Ey8jR \\"
            echo "  ${mirror}/hasura/graphql-engine:${version}"
            exit 0
        fi
    done
done

echo ""
echo "No images found via mirrors. Use binary method instead:"
echo "wget https://github.com/hasura/graphql-engine/releases/download/v2.33.0/graphql-engine-v2.33.0-linux-amd64"
```

## Quick Manual Test

Try these one by one on your server:

```bash
# Most likely to work - Tencent Cloud
docker pull ccr.ccs.tencentyun.com/hasura/graphql-engine:v2.33.0

# If above fails, try:
docker pull docker.1ms.run/hasura/graphql-engine:v2.33.0

# Or:
docker pull hub.xdark.top/hasura/graphql-engine:v2.33.0
```

## Once You Find a Working Mirror

Let's say `docker.1ms.run/hasura/graphql-engine:v2.33.0` works:

```bash
# 1. Stop old Hasura
docker ps | grep hasura
docker stop <container-id>

# 2. Start new version
docker run -d \
  --name hasura-v233 \
  --restart=always \
  -p 28717:8080 \
  -e HASURA_GRAPHQL_DATABASE_URL="postgres://kedgetech:Nie112233@pgm-bp10tol2zf3i95f68o.pg.rds.aliyuncs.com:5432/kedge_db" \
  -e HASURA_GRAPHQL_ENABLE_CONSOLE=true \
  -e HASURA_GRAPHQL_ADMIN_SECRET=9AgJckEMHPRgrasj7Ey8jR \
  -e HASURA_GRAPHQL_METADATA_DATABASE_URL="postgres://kedgetech:Nie112233@pgm-bp10tol2zf3i95f68o.pg.rds.aliyuncs.com:5432/kedge_db" \
  docker.1ms.run/hasura/graphql-engine:v2.33.0

# 3. Test it works
curl http://localhost:28717/v1/version
# Should show v2.33.0

# 4. Apply metadata (from your local machine)
hasura metadata apply --endpoint http://47.99.175.26:28717 --admin-secret 9AgJckEMHPRgrasj7Ey8jR

# 5. Test the fix works
curl -X POST http://47.99.175.26:28717/v2/query \
  -H "X-Hasura-Admin-Secret: 9AgJckEMHPRgrasj7Ey8jR" \
  -H "Content-Type: application/json" \
  -d '{"type": "run_sql", "args": {"source": "kedge_db", "sql": "SELECT COUNT(*) FROM kedge_practice.users;"}}'
```

## Alternative: Configure Your Docker to Use Mirror

If you want to pull original images through a mirror:

```bash
# Edit Docker daemon config
cat > /etc/docker/daemon.json << EOF
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://hub.xdark.top",
    "https://ccr.ccs.tencentyun.com"
  ]
}
EOF

# Restart Docker
systemctl restart docker

# Then try original image
docker pull hasura/graphql-engine:v2.33.0
```

## Fallback: Just Use the Binary

If all mirrors fail:
```bash
# This ALWAYS works - GitHub CDN is reliable in China
wget https://github.com/hasura/graphql-engine/releases/download/v2.33.0/graphql-engine-v2.33.0-linux-amd64
chmod +x graphql-engine-v2.33.0-linux-amd64

# Stop old version and start new
./graphql-engine-v2.33.0-linux-amd64 serve \
  --database-url "postgres://kedgetech:Nie112233@pgm-bp10tol2zf3i95f68o.pg.rds.aliyuncs.com:5432/kedge_db" \
  --enable-console \
  --admin-secret "9AgJckEMHPRgrasj7Ey8jR" \
  --server-port 28717
```