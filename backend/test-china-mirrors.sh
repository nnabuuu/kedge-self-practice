#!/bin/bash

# Test Chinese mirrors for Hasura availability
MIRRORS=(
    "ccr.ccs.tencentyun.com"
    "docker.1ms.run"
    "hub.xdark.top"
    "dhub.kubesre.xyz"
    "docker.kejilion.pro"
    "docker.xuanyuan.me"
    "docker.hlmirror.com"
    "run-docker.cn"
)

IMAGE="hasura/graphql-engine:v2.33.0"

echo "Testing mirrors for $IMAGE"
echo "================================"

for MIRROR in "${MIRRORS[@]}"; do
    echo -n "Testing $MIRROR... "
    
    # Try to pull just the manifest (faster test)
    if docker pull ${MIRROR}/${IMAGE} --disable-content-trust 2>/dev/null | head -1 | grep -q "Pulling"; then
        echo "✅ SUCCESS - Image available!"
        echo "Full command: docker pull ${MIRROR}/${IMAGE}"
        echo ""
        # Don't actually pull, just test availability
        docker pull ${MIRROR}/${IMAGE} --dry-run 2>/dev/null || true
    else
        echo "❌ Not available or error"
    fi
done

echo ""
echo "Quick test commands for your server:"
echo "====================================="
for MIRROR in "${MIRRORS[@]}"; do
    echo "docker pull ${MIRROR}/${IMAGE}"
done