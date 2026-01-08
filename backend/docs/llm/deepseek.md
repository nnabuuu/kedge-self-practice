# DeepSeek 集成指南

DeepSeek 是一个成本效益高的 LLM 服务，特别适合中文内容处理。本系统已针对 DeepSeek 进行了深度优化。

## 配置

### 环境变量

```bash
# 基本配置
LLM_MODEL_QUIZ_PARSER=deepseek-chat
LLM_API_KEY=your-deepseek-api-key
LLM_BASE_URL=https://api.deepseek.com

# 可选：微调参数
LLM_TEMP_QUIZ_PARSER=0.7
LLM_MAX_TOKENS_QUIZ_PARSER=4000
```

### 在 .envrc.override 中配置

```bash
# .envrc.override
export LLM_API_KEY="sk-xxx"
export LLM_MODEL_QUIZ_PARSER="deepseek-chat"
```

## 填空题增强功能

### 问题背景

DeepSeek 生成填空题时有时会忘记添加 `____` 空白占位符。系统实现了多层恢复机制。

### 处理流程

```
输入: "东汉时期的《神农本草经》是中国第一部药物学专著。"
答案: ["神农本草经"]

第一步: 本地修复
  - 在题目中搜索答案文本
  - 尝试多种引号模式：《》、""、「」、【】
  - 替换找到的文本为 ____

第二步: API 重新生成（最多 3 次重试）
  - 发送明确指令给 DeepSeek
  - 渐进温度：0.2 → 0.3 → 0.4
  - 验证输出是否有正确数量的空白

第三步: 最终回退
  - 创建保证有效的结构化格式
  - 单答案："关于以下内容，____是什么？"
  - 多答案："根据以下内容，请填空（____、____）："

输出: "东汉时期的《____》是中国第一部药物学专著。"
```

### 重试机制

- **渐进温度**: 每次重试增加温度（0.2, 0.3, 0.4）
- **速率限制保护**: 检测到限制时等待 2 秒
- **最多 3 次重试**: 平衡效率和 API 使用

## JSON 解析增强

### 问题背景

即使使用 `response_format: { type: 'json_object' }`，LLM 仍可能返回：
- 无效 JSON 语法（尾随逗号、单引号）
- Markdown 代码块包裹的 JSON
- 混合文本和 JSON 内容
- 缺少必需字段
- 错误的字段名

### 多层解析策略

#### 策略 1: 直接解析
```typescript
JSON.parse(content);
```

#### 策略 2: 提取代码块
```typescript
// 处理 ```json 包裹的响应
content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
```

#### 策略 3: 提取混合内容
```typescript
// 从其他文本中找到 JSON
content.match(/\{[\s\S]*\}/);
```

#### 策略 4: 自动修复常见错误
- 移除尾随逗号: `,}` → `}`
- 修复单引号: `'` → `"`
- 引用未引用的键: `key:` → `"key":`
- 移除注释

#### 策略 5: 解析数组
```typescript
// 处理直接返回数组的情况
if (content.trim().startsWith('[')) {
  return { items: JSON.parse(content) };
}
```

### 字段名归一化

系统自动处理不同的字段命名：

| 字段 | 可能的变体 |
|------|-----------|
| type | quiz_type, questionType |
| question | text, content, prompt |
| options | choices, A/B/C/D 分离字段 |
| answer | correct_answer, correctAnswer, answers |

### 类型名归一化

```javascript
"single" → "single-choice"
"multiple" → "multiple-choice"
"fill" → "fill-in-the-blank"
"essay" → "subjective"
```

## 监控

### 日志消息

查找这些日志来了解系统行为：

```
DeepSeek: JSON parsed successfully on first attempt     // 完美响应
DeepSeek: JSON extracted from code block                // 有代码块包裹
DeepSeek: JSON extracted from mixed content             // 有额外文本
DeepSeek: JSON parsed after auto-fixing                 // 有语法错误
DeepSeek: Auto-replaced "X" with blank in question      // 本地修复成功
DeepSeek: Successfully regenerated with N blank(s)      // API 修复成功
DeepSeek: Created fallback fill-in-blank question       // 使用回退格式
DeepSeek: Rate limited, waiting before retry...         // 处理速率限制
```

## 与 GPT-4 对比

| 特性 | DeepSeek | GPT-4 |
|------|----------|-------|
| 成本 | 约 GPT-4 的 1/10 | 基准 |
| 中文支持 | 优秀 | 良好 |
| 填空题生成 | 需要增强处理 | 相对稳定 |
| 响应速度 | 快 | 中等 |
| JSON 格式遵循 | 需要多层解析 | 较好 |

## 最佳实践

1. **使用增强后的服务**: 系统已内置所有恢复机制
2. **监控日志**: 关注 "DeepSeek:" 前缀的日志
3. **测试各种文档类型**: 不同格式可能有不同表现
4. **根据使用模式调整重试次数**: 生产环境建议 3 次

## 相关文档

- [LLM 配置指南](./configuration.md)
- [题目解析功能](../features/feature-quiz-parser.md)
