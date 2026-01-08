# Kedge Backend

中学生自主练习平台后端服务。基于 NestJS + PostgreSQL + Redis 构建。

## 项目结构

```
backend/
├── packages/                    # 源代码
│   ├── apps/
│   │   └── api-server/         # 主 API 应用 (NestJS)
│   ├── libs/                   # 共享库
│   │   ├── auth/              # JWT 认证 & Guards
│   │   ├── common/            # 公共工具、日志、错误处理
│   │   ├── configs/           # 配置管理
│   │   ├── feedback/          # 用户反馈
│   │   ├── knowledge-point/   # 知识点管理
│   │   ├── leaderboard/       # 排行榜
│   │   ├── models/            # 数据模型 (Zod schemas)
│   │   ├── persistent/        # 数据库层 (Slonik)
│   │   ├── practice/          # 练习会话
│   │   ├── quiz/              # 题目管理
│   │   └── quiz-parser/       # DOCX 解析 & LLM 集成
│   └── dev/
│       └── database/          # Hasura & 数据库迁移
│
├── docs/                       # 文档
│   ├── deployment/            # 部署指南
│   ├── database/              # 数据库文档
│   ├── llm/                   # LLM 集成指南
│   ├── api/                   # API 文档
│   └── features/              # 功能设计文档
│
├── scripts/                    # 脚本工具
│   ├── deploy/                # 部署脚本
│   ├── database/              # 数据库脚本
│   ├── test/                  # 测试脚本
│   ├── data/                  # 数据处理脚本
│   └── utils/                 # 工具脚本
│
├── templates/                  # 数据导入模板
├── tools/                      # 构建工具
└── patches/                    # npm patches
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
nx run api-server:serve

# API 端点: http://localhost:8718/v1/
```

## 主要命令

```bash
# 开发
nx run api-server:serve              # 启动 API 服务
nx run-many --target=build --all     # 构建所有包

# 测试
nx test api-server                   # 测试 API
nx run-many --target=test --all      # 测试所有

# 数据库
hasura migrate status --endpoint $HASURA_ENDPOINT --admin-secret $HASURA_SECRET
```

## 环境配置

### 环境变量加载机制

```
┌─────────────┐    ┌──────────────────┐    ┌───────────┐
│   .envrc    │ +  │ .envrc.override  │ -> │   .env    │
│ (默认配置)  │    │  (本地覆盖配置)   │    │ (运行时)  │
└─────────────┘    └──────────────────┘    └───────────┘
                          │
                   tools/bin/get-env
```

1. `.envrc` - 默认开发配置（提交到 Git）
2. `.envrc.override` - 本地覆盖配置（gitignored，包含敏感信息）
3. `.env` - 由 `source .envrc` 自动生成（gitignored）

### 应用如何加载环境变量

应用启动时通过 `dotenv/config` 自动从当前工作目录读取 `.env` 文件：

```typescript
// main.ts 顶部
import 'dotenv/config';  // 自动加载 .env
```

**重要说明**：
- `.env` 文件**不会**被打包到 `dist/` 目录
- `dotenv` 在运行时从**当前工作目录 (cwd)** 读取 `.env`
- 因此必须在 `backend/` 目录下执行 `node dist/...`

### 配置步骤

```bash
# 创建本地覆盖配置
cp .envrc.override.example .envrc.override
# 编辑 .envrc.override 填入实际凭据
```

## 文档索引

- [Docker 部署指南](./docs/deployment/docker.md)
- [Hasura 升级指南](./docs/database/hasura-upgrade.md)
- [DeepSeek 集成](./docs/llm/deepseek.md)
- [LLM 配置指南](./docs/llm-configuration-guide.md)
- [API 测试文档](./docs/api-testing-practice-endpoints.md)
- [练习策略设计](./docs/practice-strategies-design.md)

## 脚本说明

详见 [scripts/README.md](./scripts/README.md)


## Environment Configuration

### Setting up environment variables
1. The `.envrc` file contains safe default values for local development
2. For production or environment-specific credentials:
   - Copy `.envrc.override.example` to `.envrc.override`
   - Update `.envrc.override` with your actual credentials
   - **IMPORTANT**: `.envrc.override` is gitignored and should NEVER be committed

```bash
cp .envrc.override.example .envrc.override
# Edit .envrc.override with your credentials
```

## Prerequisite

### Install asdf
1. install asdf
https://asdf-vm.com/guide/getting-started.html

2. install asdf plugins
```
cat .tool-versions | awk '{print $1}' | xargs -n 1 asdf plugin add
```

### Build all
nx run-many --target=build --all

## Production Deployment

### Build and Start with PM2

```bash
# 1. Go to backend directory
cd backend

# 2. Install dependencies
pnpm install

# 3. Build for production
npx nx build api-server --configuration=production

# 4. Source environment variables (generates .env file)
source .envrc

# 5. Start with PM2
pm2 start ecosystem.config.js --env production

# 6. Save PM2 process list (survives reboot)
pm2 save
```

### Direct Node Execution (without PM2)

```bash
# 1. Build
npx nx build api-server --configuration=production

# 2. Generate .env file
source .envrc

# 3. Run directly (must be in backend/ directory)
node dist/packages/apps/api-server/main.js
```

**注意**: 必须在 `backend/` 目录下执行，因为 dotenv 从当前工作目录读取 `.env` 文件。

### PM2 Commands

```bash
pm2 list                        # View status
pm2 logs kedge-api-server       # View logs
pm2 restart kedge-api-server    # Restart
pm2 stop kedge-api-server       # Stop
pm2 delete kedge-api-server     # Delete
```

### Redeploy after code changes

```bash
cd backend
git pull
pnpm install
npx nx build api-server --configuration=production
pm2 restart kedge-api-server
```

### Start from scratch

```bash
cd backend
git pull
pnpm install
npx nx build api-server --configuration=production
source .envrc
pm2 delete kedge-api-server 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
```


