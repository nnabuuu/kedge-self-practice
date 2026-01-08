# 文档索引

## 目录结构

```
docs/
├── deployment/           # 部署相关
│   └── docker.md        # Docker 部署指南
│
├── database/            # 数据库相关
│   └── hasura-upgrade.md  # Hasura 升级指南
│
├── llm/                 # LLM 集成
│   └── deepseek.md      # DeepSeek 集成指南
│
├── api/                 # API 文档
│   └── api-testing-practice-endpoints.md
│
└── features/            # 功能设计
    ├── feature-quiz-image-processing.md
    ├── feature-quiz-parser.md
    ├── feature-user-auth.md
    └── practice-strategies-design.md
```

## 部署

| 文档 | 说明 |
|------|------|
| [Docker 部署](./deployment/docker.md) | Docker 容器化部署完整指南 |
| [PM2 生产部署](../README.md#production-deployment) | 使用 PM2 部署到生产环境 |

## 数据库

| 文档 | 说明 |
|------|------|
| [Hasura 升级](./database/hasura-upgrade.md) | 从 v2.0.10 升级到 v2.33.0+ |

## LLM 集成

| 文档 | 说明 |
|------|------|
| [DeepSeek 集成](./llm/deepseek.md) | DeepSeek API 集成和优化 |
| [LLM 配置指南](./llm-configuration-guide.md) | 多 LLM 提供商配置 |

## API 文档

| 文档 | 说明 |
|------|------|
| [练习 API 测试](./api-testing-practice-endpoints.md) | 练习相关 API 端点测试 |

## 功能设计

| 文档 | 说明 |
|------|------|
| [题目解析](./feature-quiz-parser.md) | DOCX 文件解析功能 |
| [图片处理](./feature-quiz-image-processing.md) | 题目图片处理功能 |
| [用户认证](./feature-user-auth.md) | 用户认证系统 |
| [练习策略](./practice-strategies-design.md) | 自适应练习策略设计 |
| [DOCX 图片支持](./instruction-docx-image-support.md) | 前端集成 DOCX 图片 |

## 测试报告

| 文档 | 说明 |
|------|------|
| [测试覆盖率报告](./测试覆盖率报告.md) | 测试覆盖率统计 |
| [测试工作总结](./测试工作总结.md) | 测试工作记录 |

## 架构文档

| 文档 | 说明 |
|------|------|
| [领域模型重构](./domain-model-refactoring-example.md) | 领域模型设计示例 |
| [领域模型实现](./domain-model-implementation-summary.md) | 领域模型实现总结 |
