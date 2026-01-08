# Backend Scripts

后端脚本工具集，用于管理和维护 Kedge 练习平台。

## 目录结构

```
scripts/
├── deploy/                 # 部署脚本
│   ├── build-and-deploy.sh    # 构建和部署一键脚本
│   ├── deploy.sh              # 部署脚本
│   └── start-production.sh    # 生产环境启动
│
├── database/              # 数据库脚本
│   ├── apply-knowledge-points-migration.sh  # 知识点迁移
│   ├── apply-migrations-direct.sh           # 直接 SQL 迁移
│   ├── fix-misplaced-items.sql             # 修复错位数据
│   ├── fix-unit5-knowledge-points.sql      # 修复第5单元知识点
│   └── populate-answer-index.sql           # 填充答案索引
│
├── test/                  # 测试脚本
│   ├── test-china-mirrors.sh    # 测试中国镜像源
│   ├── test-deepseek.sh         # 测试 DeepSeek API
│   ├── test-llm-endpoint.sh     # 测试 LLM 端点
│   └── verify-llm-config.sh     # 验证 LLM 配置
│
├── data/                  # 数据处理脚本
│   ├── generate-fill-blank-alternatives.ts  # 生成填空题替代答案
│   ├── fix-order-independent-blanks.ts      # 修复顺序无关填空题
│   ├── migrate-attachments-to-oss.ts        # 迁移附件到 OSS
│   └── validate-quiz-images.ts              # 验证题目图片
│
└── utils/                 # 工具脚本
    ├── merge-env.sh           # 合并环境变量
    └── generate-password-hash.js  # 生成密码哈希
```

## 快速导航

| 任务 | 脚本 |
|------|------|
| 部署到生产 | `scripts/deploy/build-and-deploy.sh` |
| 测试 LLM 配置 | `scripts/test/verify-llm-config.sh` |
| 生成填空题替代答案 | `scripts/data/generate-fill-blank-alternatives.ts` |
| 数据库迁移 | `scripts/database/apply-migrations-direct.sh` |
| 合并环境配置 | `scripts/utils/merge-env.sh` |

---

## 数据处理脚本详细说明

### `generate-fill-blank-alternatives.ts`

Automatically generate alternative answers and hints for fill-in-the-blank quizzes using AI.

#### Purpose

This script processes fill-in-the-blank questions in the database and uses GPT to intelligently generate:
- **Alternative Answers**: Other acceptable forms of the correct answer (synonyms, abbreviations, different names, etc.)
- **Hints**: Category hints for each blank (e.g., "人名", "年份", "著作")

This enhances the student learning experience by:
- Accepting multiple valid answer formats
- Providing helpful context clues without giving away the answer
- Reducing frustration from technically correct but differently formatted answers

#### Prerequisites

1. **Node.js 18+** installed
2. **tsx** runtime (install with `npm install -g tsx` or `pnpm add -g tsx`)
3. **Backend API server running** at `http://localhost:8718` (or custom URL)
4. **LLM API key** configured in `.envrc` or `.envrc.override`

#### Configuration

The script reads configuration from environment variables. Make sure these are set in your `.envrc` or `.envrc.override`:

```bash
# Required
export LLM_API_KEY="your-openai-or-deepseek-api-key"

# Optional (with defaults)
export LLM_MODEL_QUIZ_PARSER="gpt-4o"          # AI model to use
export LLM_TEMP_QUIZ_PARSER="0.1"              # Temperature (0.0-1.0)
export LLM_MAX_TOKENS_QUIZ_PARSER="4000"       # Max response tokens
export API_PORT="8718"                         # Backend API port
```

#### Authentication

**⚠️ IMPORTANT: This script requires teacher role authentication.**

The script provides three authentication methods (in priority order):

1. **JWT Token** (recommended for automation):
   ```bash
   npx tsx scripts/generate-fill-blank-alternatives.ts --jwt-token=eyJhbGc...
   ```

2. **Username/Password** (login via API):
   ```bash
   npx tsx scripts/generate-fill-blank-alternatives.ts \
     --username=teacher@example.com \
     --password=yourpassword
   ```

3. **Interactive Prompt** (most secure, no command history):
   ```bash
   npx tsx scripts/generate-fill-blank-alternatives.ts
   # Script will prompt for authentication method and credentials
   ```

**⚠️ Security Best Practices:**
- ❌ **NEVER** commit credentials to version control
- ❌ **NEVER** add credentials to `.envrc` or `.envrc.override`
- ❌ **NEVER** hardcode credentials in scripts
- ✅ **DO** use interactive prompts for manual runs
- ✅ **DO** use environment-specific secrets management for automation
- ✅ **DO** use JWT tokens with short expiration for scripts

#### Usage

1. **Start the backend API server**:
   ```bash
   cd backend
   source .envrc
   nx run api-server:serve
   ```

2. **In a new terminal, run the script**:
   ```bash
   cd backend
   source .envrc
   tsx scripts/generate-fill-blank-alternatives.ts
   ```

#### Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--jwt-token=TOKEN` | JWT authentication token (teacher role) | `npx tsx scripts/generate-fill-blank-alternatives.ts --jwt-token=eyJhbGc...` |
| `--username=EMAIL` | Teacher email for login | `npx tsx scripts/generate-fill-blank-alternatives.ts --username=teacher@example.com` |
| `--password=PASS` | Teacher password for login | `npx tsx scripts/generate-fill-blank-alternatives.ts --password=secret` |
| `--dry-run` | Preview changes without updating database | `npx tsx scripts/generate-fill-blank-alternatives.ts --dry-run` |
| `--limit=N` | Process only first N quizzes | `npx tsx scripts/generate-fill-blank-alternatives.ts --limit=10` |
| `--force` | Regenerate even if alternatives/hints exist | `npx tsx scripts/generate-fill-blank-alternatives.ts --force` |
| `--quiz-id=ID` | Process only a specific quiz | `npx tsx scripts/generate-fill-blank-alternatives.ts --quiz-id=abc-123` |
| `--retry-errors=FILE` | Retry quizzes from a previous error log | `npx tsx scripts/generate-fill-blank-alternatives.ts --retry-errors=errors-2025-01-15.json` |
| `--api-url=URL` | Override API URL | `npx tsx scripts/generate-fill-blank-alternatives.ts --api-url=http://localhost:3000` |

#### Examples

**Interactive authentication (most secure)**:
```bash
npx tsx scripts/generate-fill-blank-alternatives.ts --dry-run
# Will prompt for authentication method and credentials
```

**Using JWT token**:
```bash
npx tsx scripts/generate-fill-blank-alternatives.ts \
  --jwt-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \
  --dry-run
```

**Using username/password**:
```bash
npx tsx scripts/generate-fill-blank-alternatives.ts \
  --username=teacher@example.com \
  --password=yourpassword \
  --limit=5
```

**Process first 5 quizzes only**:
```bash
npx tsx scripts/generate-fill-blank-alternatives.ts --limit=5 --jwt-token=...
```

**Force regeneration for all quizzes** (even if they already have alternatives):
```bash
npx tsx scripts/generate-fill-blank-alternatives.ts --force --jwt-token=...
```

**Process a specific quiz by ID**:
```bash
npx tsx scripts/generate-fill-blank-alternatives.ts \
  --quiz-id=550e8400-e29b-41d4-a716-446655440000 \
  --jwt-token=...
```

**Retry failed quizzes from error log**:
```bash
npx tsx scripts/generate-fill-blank-alternatives.ts \
  --retry-errors=errors-2025-01-15.json \
  --jwt-token=...
```

**Combine options**:
```bash
npx tsx scripts/generate-fill-blank-alternatives.ts \
  --dry-run \
  --limit=3 \
  --jwt-token=...
```

#### How It Works

1. **Pre-flight Check**: Validates all configuration and environment variables
   - Shows API URL, LLM model, temperature, max tokens
   - Masks API key (shows only last 4 characters)
   - Asks for confirmation before proceeding
2. **Authentication**: Prompts for credentials (JWT token or username/password)
3. **API Health Check**: Verifies backend server is running and accessible
4. **Fetch Quizzes**: Retrieves all fill-in-the-blank quizzes from the backend API
5. **Filter**: Skips quizzes that already have alternatives and hints (unless `--force` is used)
6. **Generate**: For each quiz:
   - Sends question, answer, and context to GPT
   - Receives structured JSON with alternative answers and hints
   - Validates and normalizes the response
7. **Update**: Updates the quiz via the backend API (`PUT /v1/quiz/:id`)
8. **Report**: Displays summary of updated, skipped, and failed quizzes

#### Output Example

```
🚀 Fill-in-the-Blank Alternative Answers & Hints Generator
======================================================================

⚙️  Script Options:
   Dry Run: No
   Limit: 5
   Force: No (skip if exists)

🔍 Pre-flight Configuration Check:
   ✓ API URL: http://localhost:8718
   ✓ LLM Model: gpt-4o
   ✓ Temperature: 0.1
   ✓ Max Tokens: 4000
   ✓ LLM Base URL: (auto-detected)
   ✓ LLM API Key: ***xyz9

❓ Configuration looks good. Proceed with script execution?
   Continue? (yes/no): yes

🔧 Loading configuration and authenticating...

🔐 Authentication Required
   This script requires teacher access to update quizzes.
   You can provide credentials in two ways:
   1. JWT Token: --jwt-token=your-token
   2. Username/Password: --username=your-email --password=your-pass

Choose authentication method (1=Token, 2=Login): 2
Enter email: teacher@example.com
Enter password: ********

🔐 Logging in as teacher@example.com...
   ✅ Login successful
   ✅ Configuration loaded successfully

🏥 Checking API health at http://localhost:8718...
   ✅ API is healthy and reachable

🤖 Initializing LLM client...
   ✅ LLM client initialized

📊 Fetching fill-in-the-blank quizzes from API...
✅ Found 5 fill-in-the-blank quizzes

🔄 Processing quizzes...
======================================================================

[1/5] Processing quiz: 550e8400-e29b-41d4-a716-446655440000
  📝 Question: 中华人民共和国于____年____月____日成立
  ✏️  Answer: ["1949","10","1"]
  🔄 Needs generation...
  🤖 Calling gpt-4o...
  ✅ Received response (234 chars)
  📊 Generated:
     Alternative answers: [["一九四九"],["十"],["一"]]
     Hints: ["年份","月份","日期"]
  💾 Successfully updated via API

[2/5] Processing quiz: 660e8400-e29b-41d4-a716-446655440001
  📝 Question: 《神农本草经》是中国最早的药物学著作，作者是____
  ✏️  Answer: "神农"
  ⏭️  Skipping - already has alternatives and hints

...

======================================================================
📊 Summary
======================================================================
   Total quizzes: 5
   ✅ Updated: 3
   ⏭️  Skipped: 2
   ❌ Errors: 0

✅ Script completed successfully!
```

#### Error Handling

When quizzes fail to process, the script automatically:

1. **Logs the error** to console with quiz ID and error message
2. **Saves error details** to a JSON file (e.g., `errors-2025-01-15.json`)
3. **Displays a summary** of all errors at the end
4. **Provides retry command** to easily retry failed quizzes

**Error Log Format** (`errors-YYYY-MM-DD.json`):
```json
[
  {
    "quizId": "550e8400-e29b-41d4-a716-446655440000",
    "question": "中华人民共和国于____年____月____日成立...",
    "answer": ["1949", "10", "1"],
    "error": "Failed to update quiz: 500 - Internal Server Error",
    "timestamp": "2025-01-15T10:30:45.123Z"
  }
]
```

**Retrying Failed Quizzes**:
After a run with errors, you'll see a helpful message:
```
💡 To retry failed quizzes, run:
   tsx scripts/generate-fill-blank-alternatives.ts --retry-errors=errors-2025-01-15.json
```

This will:
- Load quiz IDs from the error file
- Fetch fresh quiz data from the API
- Retry generation only for those quizzes
- Create a new error file if any still fail

#### Troubleshooting

**API Connection Error**:
```
❌ API is not reachable
Cannot connect to API at http://localhost:8718
```
**Solution**: Make sure the backend API server is running with `nx run api-server:serve`

**LLM API Key Error**:
```
LLM_API_KEY is not set or is using the default placeholder
```
**Solution**: Set a valid API key in `.envrc.override`:
```bash
export LLM_API_KEY="sk-your-actual-key-here"
```

**Rate Limiting**:
The script includes a 1-second delay between requests to avoid rate limiting. If you still encounter issues, you can:
- Use a model with higher rate limits
- Process in smaller batches with `--limit`
- Increase the delay in the script code

#### Cost Considerations

- Each quiz requires one API call to the LLM
- Average tokens per request: ~500-1000 tokens
- For 100 quizzes using GPT-4o:
  - Estimated cost: ~$0.50-$1.00
  - Time: ~2-3 minutes (with 1s delays)

#### Best Practices

1. **Always run with `--dry-run` first** to preview changes
2. **Start with a small `--limit`** to test on a few quizzes
3. **Use `--force` sparingly** as it regenerates existing data and costs more
4. **Monitor the output** for any errors or unexpected results
5. **Keep your `.envrc.override`** backed up with your API keys

---

### `fix-order-independent-blanks.ts`

Fix fill-in-the-blank quizzes where coordinate blanks can be answered in any order.

#### Purpose

This script identifies fill-in-the-blank questions with parallel/coordinate blanks that are semantically interchangeable, and generates cross-referenced alternative answers to accept answers in any order.

**Problem it solves**: Students writing correct answers in different order (e.g., "西夏、辽" instead of "辽、西夏") get marked wrong even though both orders are semantically valid.

**Solution**:
- Detects coordinate relationships between blanks using GPT semantic analysis
- Generates cross-referenced alternatives with position prefixes (e.g., `["[0]西夏", "[1]辽"]`)
- Automatically updates quizzes to accept any valid ordering

**Pre-filtering to save tokens**:
- Only analyzes quizzes containing conjunctions: "和"、"与"、"以及"、"、"
- Skips single-blank questions or questions without coordination markers
- Use `--force` to analyze all multi-blank quizzes regardless

#### Prerequisites

1. **Node.js 18+** installed
2. **tsx** runtime (install with `npm install -g tsx` or `pnpm add -g tsx`)
3. **Backend API server running** at `http://localhost:8718` (or custom URL)
4. **LLM API key** configured in `.envrc` or `.envrc.override`

#### Configuration

The script reads configuration from environment variables. Make sure these are set in your `.envrc` or `.envrc.override`:

```bash
# Required
export LLM_API_KEY="your-openai-or-deepseek-api-key"

# Optional (with defaults)
export LLM_MODEL_QUIZ_PARSER="gpt-4o"          # AI model to use
export LLM_TEMP_QUIZ_PARSER="0.1"              # Temperature (0.0-1.0)
export LLM_MAX_TOKENS_QUIZ_PARSER="4000"       # Max response tokens
export API_PORT="8718"                         # Backend API port
```

#### Authentication

**⚠️ IMPORTANT: This script requires teacher role authentication.**

The script provides three authentication methods (same as `generate-fill-blank-alternatives.ts`):

1. **JWT Token** (recommended for automation):
   ```bash
   npx tsx scripts/fix-order-independent-blanks.ts --jwt-token=eyJhbGc...
   ```

2. **Username/Password** (login via API):
   ```bash
   npx tsx scripts/fix-order-independent-blanks.ts \
     --username=teacher@example.com \
     --password=yourpassword
   ```

3. **Interactive Prompt** (most secure, no command history):
   ```bash
   npx tsx scripts/fix-order-independent-blanks.ts
   # Script will prompt for authentication method and credentials
   ```

**⚠️ Security Best Practices:**
- ❌ **NEVER** commit credentials to version control
- ❌ **NEVER** add credentials to `.envrc` or `.envrc.override`
- ❌ **NEVER** hardcode credentials in scripts
- ✅ **DO** use interactive prompts for manual runs
- ✅ **DO** use environment-specific secrets management for automation
- ✅ **DO** use JWT tokens with short expiration for scripts

#### Usage

1. **Start the backend API server**:
   ```bash
   cd backend
   source .envrc
   nx run api-server:serve
   ```

2. **In a new terminal, run the script**:
   ```bash
   cd backend
   source .envrc
   tsx scripts/fix-order-independent-blanks.ts
   ```

#### Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--jwt-token=TOKEN` | JWT authentication token (teacher role) | `npx tsx scripts/fix-order-independent-blanks.ts --jwt-token=eyJhbGc...` |
| `--username=EMAIL` | Teacher email for login | `npx tsx scripts/fix-order-independent-blanks.ts --username=teacher@example.com` |
| `--password=PASS` | Teacher password for login | `npx tsx scripts/fix-order-independent-blanks.ts --password=secret` |
| `--dry-run` | Preview changes without updating database | `npx tsx scripts/fix-order-independent-blanks.ts --dry-run` |
| `--limit=N` | Process only first N quizzes | `npx tsx scripts/fix-order-independent-blanks.ts --limit=10` |
| `--force` | Analyze all multi-blank quizzes, ignoring conjunction pre-filter | `npx tsx scripts/fix-order-independent-blanks.ts --force` |
| `--quiz-id=ID` | Process only a specific quiz | `npx tsx scripts/fix-order-independent-blanks.ts --quiz-id=abc-123` |
| `--retry-errors=FILE` | Retry quizzes from a previous error log | `npx tsx scripts/fix-order-independent-blanks.ts --retry-errors=errors-2025-01-15.json` |
| `--api-url=URL` | Override API URL | `npx tsx scripts/fix-order-independent-blanks.ts --api-url=http://localhost:3000` |

#### Examples

**Interactive authentication with dry-run**:
```bash
npx tsx scripts/fix-order-independent-blanks.ts --dry-run
# Will prompt for authentication method and credentials
# Shows what would be changed without updating
```

**Using JWT token to process first 10 quizzes**:
```bash
npx tsx scripts/fix-order-independent-blanks.ts \
  --jwt-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \
  --limit=10
```

**Force analyze all multi-blank quizzes (ignores conjunction pre-filter)**:
```bash
npx tsx scripts/fix-order-independent-blanks.ts \
  --force \
  --jwt-token=...
```

**Process a specific quiz by ID**:
```bash
npx tsx scripts/fix-order-independent-blanks.ts \
  --quiz-id=550e8400-e29b-41d4-a716-446655440000 \
  --jwt-token=...
```

**Retry failed quizzes from error log**:
```bash
npx tsx scripts/fix-order-independent-blanks.ts \
  --retry-errors=errors-2025-01-15.json \
  --jwt-token=...
```

#### How It Works

1. **Pre-flight Check**: Validates all configuration and environment variables
2. **Authentication**: Prompts for credentials (JWT token or username/password)
3. **API Health Check**: Verifies backend server is running and accessible
4. **Fetch Quizzes**: Retrieves all fill-in-the-blank quizzes with multiple blanks
5. **Pre-filter**: For each quiz (unless `--force` is used):
   - Checks if question contains conjunctions: "和"、"与"、"以及"、"、"
   - Skips if no conjunctions found (saves GPT tokens)
6. **Semantic Analysis**: For each qualifying quiz:
   - Sends question and answers to GPT for semantic analysis
   - GPT determines if blanks are truly order-independent
   - Returns interchangeable pairs and reasoning
7. **Generate Cross-References**: For order-independent blanks:
   - Creates position-prefixed alternatives (e.g., `["[0]西夏", "[1]辽"]`)
   - Preserves existing alternatives and hints
8. **Update**: Updates the quiz via the backend API (`PUT /v1/quiz/:id`)
9. **Report**: Displays summary of updated, skipped, and failed quizzes

#### Output Example

```
🚀 Order-Independent Blanks Fixer
======================================================================

⚙️  Script Options:
   Dry Run: No
   Limit: 10
   Force: No (skip without conjunctions)

🔍 Pre-flight Configuration Check:
   ✓ API URL: http://localhost:8718
   ✓ LLM Model: gpt-4o
   ✓ Temperature: 0.1
   ✓ Max Tokens: 4000
   ✓ LLM Base URL: (auto-detected)
   ✓ LLM API Key: ***xyz9

❓ Configuration looks good. Proceed with script execution?
   Continue? (yes/no): yes

🔧 Loading configuration and authenticating...
   ✅ Configuration loaded successfully

🏥 Checking API health at http://localhost:8718...
   ✅ API is healthy and reachable

🤖 Initializing LLM client...
   ✅ LLM client initialized

📊 Fetching multi-blank fill-in-the-blank quizzes from API...
✅ Found 25 multi-blank quizzes

🔄 Processing quizzes...
======================================================================

[1/25] Processing quiz: 550e8400-e29b-41d4-a716-446655440000
  📝 Question: 北宋和北方的____、____政权并立
  ✏️  Answer: ["辽","西夏"]
  🔍 Contains conjunctions - analyzing...
  🤖 Calling gpt-4o for semantic analysis...
  ✅ Detected order-independent blanks!
     Interchangeable pairs: [[0, 1]]
     Reasoning: "辽"和"西夏"是平等的并列政权，顺序不影响语义
  📊 Generated cross-references:
     New alternatives: ["[0]西夏", "[1]辽"]
  💾 Successfully updated via API

[2/25] Processing quiz: 660e8400-e29b-41d4-a716-446655440001
  📝 Question: 从____到____，中国经历了巨大变革
  ✏️  Answer: ["清朝","现代"]
  🔍 Contains conjunctions - analyzing...
  🤖 Calling gpt-4o for semantic analysis...
  ✅ Analysis complete
     Not order-independent: 有明确的时间顺序
  ⏭️  Skipping - blanks have fixed order

[3/25] Processing quiz: 770e8400-e29b-41d4-a716-446655440002
  📝 Question: 考古发现了____的遗址
  ✏️  Answer: ["商朝","周朝"]
  ⏭️  Skipping - no conjunctions found (和/与/以及/、)

...

======================================================================
📊 Summary
======================================================================
   Total quizzes: 25
   ✅ Updated: 8
   ⏭️  Skipped (no conjunctions): 12
   ⏭️  Skipped (fixed order): 4
   ❌ Errors: 1

✅ Script completed!
```

#### GPT Analysis Logic

The script uses GPT to intelligently determine if blanks are semantically interchangeable:

**Positive Cases (Order-Independent)**:
- "北宋和北方的____、____政权" → "辽"和"西夏" (parallel entities)
- "____和____是重要的发明" → "火药"和"指南针" (equal importance)
- "____、____等学者提出理论" → Multiple scholars of equal status

**Negative Cases (Fixed Order)**:
- "从____到____" → Has temporal/spatial order
- "____的____去世了" → Has hierarchical relationship (grandfather/grandson)
- "____朝____年" → Different semantic categories (dynasty/year)

**GPT Response Format**:
```json
{
  "is_order_independent": true,
  "interchangeable_pairs": [[0, 1]],
  "reasoning": "辽和西夏是平等的并列政权，顺序不影响语义"
}
```

#### Pre-filtering Behavior

**By default** (without `--force`):
- ✅ Analyzes quizzes containing: "和"、"与"、"以及"、"、"
- ⏭️ Skips quizzes without conjunctions (saves tokens)
- Rationale: Quizzes without coordination markers are unlikely to have order-independent blanks

**With `--force` flag**:
- ✅ Analyzes ALL multi-blank quizzes regardless of conjunctions
- Use this if you suspect order-independent blanks without explicit markers

#### Error Handling

When quizzes fail to process, the script automatically:

1. **Logs the error** to console with quiz ID and error message
2. **Saves error details** to a JSON file (e.g., `errors-2025-01-15.json`)
3. **Displays a summary** of all errors at the end
4. **Provides retry command** to easily retry failed quizzes

**Error Log Format** (`errors-YYYY-MM-DD.json`):
```json
[
  {
    "quizId": "550e8400-e29b-41d4-a716-446655440000",
    "question": "北宋和北方的____、____政权并立",
    "answer": ["辽", "西夏"],
    "error": "Failed to analyze: GPT API timeout",
    "timestamp": "2025-01-15T10:30:45.123Z"
  }
]
```

**Retrying Failed Quizzes**:
```bash
npx tsx scripts/fix-order-independent-blanks.ts \
  --retry-errors=errors-2025-01-15.json \
  --jwt-token=...
```

#### Troubleshooting

**API Connection Error**:
```
❌ API is not reachable
Cannot connect to API at http://localhost:8718
```
**Solution**: Make sure the backend API server is running with `nx run api-server:serve`

**LLM API Key Error**:
```
LLM_API_KEY is not set or is using the default placeholder
```
**Solution**: Set a valid API key in `.envrc.override`:
```bash
export LLM_API_KEY="sk-your-actual-key-here"
```

**No quizzes found with conjunctions**:
```
✅ Found 0 multi-blank quizzes with conjunctions
```
**Solution**: This is normal if your quizzes don't have coordination markers. Use `--force` to analyze all multi-blank quizzes.

**Rate Limiting**:
The script includes a 1-second delay between requests to avoid rate limiting. If you still encounter issues:
- Use a model with higher rate limits
- Process in smaller batches with `--limit`
- Increase the delay in the script code

#### Cost Considerations

- Each qualifying quiz requires one GPT API call for semantic analysis
- Average tokens per request: ~300-500 tokens (less than `generate-fill-blank-alternatives.ts`)
- Pre-filtering reduces costs significantly (typically 50-70% of quizzes are filtered out)
- For 100 multi-blank quizzes (assuming 30 qualify after pre-filtering):
  - Estimated cost: ~$0.15-$0.30
  - Time: ~30-60 seconds (with 1s delays)

#### Best Practices

1. **Always run with `--dry-run` first** to preview changes
2. **Start with a small `--limit`** to test on a few quizzes
3. **Use default pre-filtering** to save tokens (only use `--force` if needed)
4. **Monitor GPT reasoning** to ensure correct detection
5. **Review updated quizzes** to verify cross-references are correct
6. **Run after bulk quiz imports** to catch new order-independent cases

#### Difference from `generate-fill-blank-alternatives.ts`

| Feature | `generate-fill-blank-alternatives.ts` | `fix-order-independent-blanks.ts` |
|---------|--------------------------------------|-------------------------------------|
| **Purpose** | Generate initial alternatives & hints | Fix order-independence issues |
| **Target** | Quizzes without alternatives/hints | Multi-blank quizzes with conjunctions |
| **GPT Task** | Generate alternatives for each blank | Analyze semantic relationships |
| **Output** | Alternatives + hints for all blanks | Cross-referenced alternatives only |
| **Tokens** | ~500-1000 per quiz | ~300-500 per quiz |
| **Pre-filter** | Skips if alternatives exist | Skips if no conjunctions |
| **Use case** | Initial quiz setup | Maintenance/corrections |

**Recommended workflow**:
1. Run `generate-fill-blank-alternatives.ts` on new quizzes (sets up basic alternatives)
2. Run `fix-order-independent-blanks.ts` afterwards (adds order-independence support)

---

## Adding New Scripts

When adding new scripts to this directory:

1. Use TypeScript with proper type definitions
2. Add comprehensive JSDoc comments and usage instructions
3. Support `--dry-run` for preview mode
4. Read configuration from environment variables
5. Include error handling and validation
6. Provide clear progress indicators and summaries
7. Update this README with documentation
