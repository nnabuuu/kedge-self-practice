# Hasura Upgrade for China (Without DaoCloud)

## Quick Solution 1: Direct Docker Hub Pull
```bash
# On your server (as root)
# Temporarily bypass DaoCloud mirror
docker pull docker.io/hasura/graphql-engine:v2.33.0

# Or if you need to remove DaoCloud config temporarily:
mv /etc/docker/daemon.json /etc/docker/daemon.json.bak
systemctl restart docker
docker pull hasura/graphql-engine:v2.33.0
mv /etc/docker/daemon.json.bak /etc/docker/daemon.json
```

## Quick Solution 2: Use Binary Instead of Docker
```bash
# Download Hasura binary directly (no Docker needed!)
cd /opt
wget https://github.com/hasura/graphql-engine/releases/download/v2.33.0/graphql-engine-v2.33.0-linux-amd64

# Make executable
chmod +x graphql-engine-v2.33.0-linux-amd64

# Create systemd service
cat > /etc/systemd/system/hasura.service << 'EOF'
[Unit]
Description=Hasura GraphQL Engine
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt
ExecStart=/opt/graphql-engine-v2.33.0-linux-amd64 serve \
  --database-url "postgres://kedgetech:Nie112233@pgm-bp10tol2zf3i95f68o.pg.rds.aliyuncs.com:5432/kedge_db" \
  --enable-console \
  --admin-secret "9AgJckEMHPRgrasj7Ey8jR" \
  --server-port 28717
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Stop old Hasura (if running in Docker)
docker ps | grep hasura
docker stop <container-id>

# Start new Hasura service
systemctl daemon-reload
systemctl enable hasura
systemctl start hasura
systemctl status hasura
```

## Quick Solution 3: Use Alibaba Cloud Registry
```bash
# Try Alibaba Cloud (often works in China)
docker pull registry.cn-hangzhou.aliyuncs.com/dockerhub_mirror/hasura/graphql-engine:v2.33.0

# If that doesn't work, try:
docker pull registry.cn-beijing.aliyuncs.com/dockerhub_mirror/hasura/graphql-engine:v2.33.0
```

## Quick Solution 4: Manual Transfer
```bash
# On a machine with access to Docker Hub (your local machine):
docker pull hasura/graphql-engine:v2.33.0
docker save hasura/graphql-engine:v2.33.0 -o hasura-v2.33.0.tar

# Transfer to server
scp hasura-v2.33.0.tar root@47.99.175.26:/tmp/

# On server:
docker load -i /tmp/hasura-v2.33.0.tar
```

## Fastest Option: Use GitHub Release Binary

Since you're root on the server, let's do this:

```bash
# SSH to your server
ssh root@47.99.175.26

# 1. Download the binary (GitHub usually works in China)
cd /opt
wget https://github.com/hasura/graphql-engine/releases/download/v2.33.0/graphql-engine-v2.33.0-linux-amd64
chmod +x graphql-engine-v2.33.0-linux-amd64

# 2. Test it works
./graphql-engine-v2.33.0-linux-amd64 version
# Should show: v2.33.0

# 3. Find and stop current Hasura
# If it's Docker:
docker ps | grep hasura
docker stop <container-id>

# If it's a process:
ps aux | grep graphql-engine
kill <process-id>

# 4. Start new version
nohup ./graphql-engine-v2.33.0-linux-amd64 serve \
  --database-url "postgres://kedgetech:Nie112233@pgm-bp10tol2zf3i95f68o.pg.rds.aliyuncs.com:5432/kedge_db" \
  --enable-console \
  --admin-secret "9AgJckEMHPRgrasj7Ey8jR" \
  --server-port 28717 \
  > /var/log/hasura.log 2>&1 &

# 5. Check it's running
curl http://localhost:28717/healthz
# Should return: OK

curl http://localhost:28717/v1/version
# Should return: {"version":"v2.33.0"}
```

## Test the Upgrade Worked

From your local machine:
```bash
# Check version
curl http://47.99.175.26:28717/v1/version

# Test schema-qualified DDL (this should work now!)
curl -X POST http://47.99.175.26:28717/v2/query \
  -H "X-Hasura-Admin-Secret: 9AgJckEMHPRgrasj7Ey8jR" \
  -H "Content-Type: application/json" \
  -d '{"type": "run_sql", "args": {"source": "kedge_db", "sql": "CREATE INDEX IF NOT EXISTS idx_test_upgrade ON kedge_practice.users(created_at); DROP INDEX IF EXISTS kedge_practice.idx_test_upgrade;"}}'
```

## Make it Permanent with Systemd

After confirming it works:
```bash
# Create proper systemd service
cat > /etc/systemd/system/hasura.service << 'EOF'
[Unit]
Description=Hasura GraphQL Engine
After=network.target

[Service]
Type=simple
ExecStart=/opt/graphql-engine-v2.33.0-linux-amd64 serve --database-url "postgres://kedgetech:Nie112233@pgm-bp10tol2zf3i95f68o.pg.rds.aliyuncs.com:5432/kedge_db" --enable-console --admin-secret "9AgJckEMHPRgrasj7Ey8jR" --server-port 28717
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Kill the nohup process
ps aux | grep graphql-engine
kill <pid>

# Start with systemd
systemctl daemon-reload
systemctl enable hasura
systemctl start hasura
systemctl status hasura
```

## Why v2.33.0?
- It's an LTS (Long Term Support) version
- Fixes all your schema issues (bug was fixed in v2.10+)
- Stable and well-tested
- Latest features without being bleeding edge

## Rollback if Needed
```bash
# Stop new version
systemctl stop hasura
# or
kill <process-id>

# Start old version (whatever method you were using)
docker run ... hasura/graphql-engine:v2.0.10
# or restore old binary
```