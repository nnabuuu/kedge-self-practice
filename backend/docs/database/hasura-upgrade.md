# Hasura Upgrade Guide

> 从 v2.0.10 升级到 v2.33.0+ 的完整指南

## 为什么要升级

### v2.0.10 的问题
- 无法处理非 public schema 的 migrations（如 `kedge_practice`）
- 需要使用 workarounds 处理简单的 DDL 操作
- 缺少现代安全补丁
- 性能优化不足

### 升级后的好处
1. **直接 DDL 支持** - `kedge_practice` 表的 CREATE INDEX 直接可用
2. **更好的错误信息** - 清晰的失败原因说明
3. **性能提升** - GraphQL 查询速度提升 30-40%
4. **安全更新** - 2021-2024 年所有 CVE 已修复

## 升级前准备

### 1. 备份

```bash
# 备份数据库
pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} > backup_$(date +%Y%m%d).sql

# 备份 Hasura metadata
hasura metadata export --endpoint ${HASURA_ENDPOINT} --admin-secret ${HASURA_SECRET}

# 提交当前状态
git add -A && git commit -m "backup: pre-hasura-upgrade state"
```

### 2. 检查 Breaking Changes
- v2.0 → v2.10: https://hasura.io/docs/latest/migration-guide/v2-0-to-v2-10/
- v2.10 → v2.20: 主要是新增功能
- v2.20 → v2.36: 检查 webhook 和 action 格式

## 升级方式

### 方式 A: Docker Compose（推荐）

```yaml
# packages/dev/database/docker-compose.yaml
services:
  hasura:
    image: hasura/graphql-engine:v2.33.0  # 或 v2.36.1
    ports:
      - "28717:8080"
    environment:
      HASURA_GRAPHQL_DATABASE_URL: ${HASURA_GRAPHQL_DATABASE_URL}
      HASURA_GRAPHQL_ENABLE_CONSOLE: "true"
      HASURA_GRAPHQL_DEV_MODE: "true"
      HASURA_GRAPHQL_ADMIN_SECRET: ${HASURA_SECRET}
      HASURA_GRAPHQL_METADATA_DATABASE_URL: ${HASURA_GRAPHQL_DATABASE_URL}
    restart: always
```

```bash
docker-compose pull hasura
docker-compose down
docker-compose up -d
```

### 方式 B: 二进制文件（无 Docker）

```bash
# 下载二进制
wget https://github.com/hasura/graphql-engine/releases/download/v2.33.0/graphql-engine-v2.33.0-linux-amd64
chmod +x graphql-engine-v2.33.0-linux-amd64

# 创建 systemd 服务
cat > /etc/systemd/system/hasura.service << 'EOF'
[Unit]
Description=Hasura GraphQL Engine
After=network.target

[Service]
Type=simple
ExecStart=/opt/graphql-engine-v2.33.0-linux-amd64 serve \
  --database-url "${DATABASE_URL}" \
  --enable-console \
  --admin-secret "${ADMIN_SECRET}" \
  --server-port 28717
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable hasura
systemctl start hasura
```

## 中国服务器镜像问题

如果 Docker Hub 无法访问，尝试以下镜像：

### 推荐镜像源

```bash
# 腾讯云
docker pull ccr.ccs.tencentyun.com/hasura/graphql-engine:v2.33.0

# 或使用其他镜像
docker pull docker.1ms.run/hasura/graphql-engine:v2.33.0
docker pull hub.xdark.top/hasura/graphql-engine:v2.33.0
```

### 配置 Docker 镜像

```bash
# /etc/docker/daemon.json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://hub.xdark.top",
    "https://ccr.ccs.tencentyun.com"
  ]
}
```

### 手动传输

```bash
# 在可访问 Docker Hub 的机器上
docker pull hasura/graphql-engine:v2.33.0
docker save hasura/graphql-engine:v2.33.0 -o hasura-v2.33.0.tar

# 传输到服务器
scp hasura-v2.33.0.tar user@server:/tmp/

# 在服务器上
docker load -i /tmp/hasura-v2.33.0.tar
```

## 升级后验证

```bash
# 检查版本
curl ${HASURA_ENDPOINT}/v1/version
# 应返回: {"version":"v2.33.0"}

# 检查健康状态
curl ${HASURA_ENDPOINT}/healthz
# 应返回: OK

# 应用 metadata
hasura metadata apply --endpoint ${HASURA_ENDPOINT} --admin-secret ${HASURA_SECRET}

# 测试之前失败的 migration
curl -X POST ${HASURA_ENDPOINT}/v2/query \
  -H "X-Hasura-Admin-Secret: ${HASURA_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"type": "run_sql", "args": {"source": "kedge_db", "sql": "CREATE INDEX IF NOT EXISTS idx_test ON kedge_practice.users(created_at); DROP INDEX IF EXISTS kedge_practice.idx_test;"}}'
```

## 回滚计划

```bash
# Docker 方式
docker stop hasura-new
docker run ... hasura/graphql-engine:v2.0.10

# 二进制方式
systemctl stop hasura
cp /usr/local/bin/graphql-engine.backup /usr/local/bin/graphql-engine
systemctl start hasura

# 恢复数据库（如需要）
psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} < backup_YYYYMMDD.sql
```

## 推荐版本

| 版本 | 说明 |
|------|------|
| **v2.33.0** | LTS，推荐用于生产环境 |
| v2.28.0 | 上一个 LTS |
| v2.10.0 | 最低版本，修复了 schema 问题 |

## 注意事项

1. 升级通常只需 **5 分钟停机时间**
2. 所有数据保持不变（只更新 Hasura 引擎）
3. Metadata 向前兼容
4. 建议先在测试环境验证

## 相关文档

- [Hasura 官方升级指南](https://hasura.io/docs/latest/migrations-metadata-seeds/upgrade-hasura-v2/)
- [LLM 配置指南](../llm/configuration.md)
- [Docker 部署指南](../deployment/docker.md)
