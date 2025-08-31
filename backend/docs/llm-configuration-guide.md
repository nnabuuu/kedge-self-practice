# LLM Configuration Guide

## Overview

The Kedge backend uses a **single Docker image** that supports multiple LLM providers. The provider is automatically selected based on the model name in your environment variables - no code changes or rebuilds required!

## Key Principle: One Image, Multiple Providers

```
┌─────────────────────────────────────┐
│     Same Docker Image               │
│     kedge-backend:latest            │
└─────────────┬───────────────────────┘
              │
              ▼ (reads env vars at runtime)
    ┌─────────┴──────────┐
    │ LLM_MODEL_*=?       │
    └─────────┬──────────┘
              │
    ┌─────────┴──────────┬──────────────┬──────────────┐
    ▼                    ▼              ▼              ▼
gpt-* → OpenAI    deepseek-* → DeepSeek    claude-* → Anthropic
```

## Quick Start

### 1. Build Once

```bash
# Build the universal image
cd backend
./build-and-deploy.sh

# This creates: kedge-backend:latest
```

### 2. Deploy with Your Choice of LLM

Create `.env` file on your production server:

#### Option A: DeepSeek (Cost-effective)
```env
LLM_MODEL_QUIZ_PARSER=deepseek-chat
LLM_MODEL_QUIZ_RENDERER=deepseek-chat
LLM_MODEL_ANSWER_VALIDATOR=deepseek-chat
LLM_MODEL_KNOWLEDGE_EXTRACTOR=deepseek-chat
DEEPSEEK_API_KEY=your-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

#### Option B: OpenAI (High quality)
```env
LLM_MODEL_QUIZ_PARSER=gpt-4o-2024-08-06
LLM_MODEL_QUIZ_RENDERER=gpt-4o-mini
LLM_MODEL_ANSWER_VALIDATOR=gpt-4o-mini
LLM_MODEL_KNOWLEDGE_EXTRACTOR=gpt-4o
OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.openai.com/v1
```

#### Option C: Mixed (Optimize cost/quality)
```env
# Use DeepSeek for high-volume tasks
LLM_MODEL_QUIZ_PARSER=deepseek-chat
LLM_MODEL_ANSWER_VALIDATOR=deepseek-chat

# Use OpenAI for quality-critical tasks
LLM_MODEL_QUIZ_RENDERER=gpt-4o-mini
LLM_MODEL_KNOWLEDGE_EXTRACTOR=gpt-4o

# Both API keys
DEEPSEEK_API_KEY=your-deepseek-key
OPENAI_API_KEY=sk-your-openai-key
```

### 3. Run the Container

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    image: kedge-backend:latest
    env_file: .env  # All config from external file
    ports:
      - "8718:8718"
    volumes:
      - ./uploads:/app/uploads
      - ./data:/app/data
```

```bash
docker-compose up -d
```

## How Provider Detection Works

The system automatically detects the provider based on the model name prefix:

| Model Prefix | Provider | Example Models |
|-------------|----------|----------------|
| `gpt-*` | OpenAI | gpt-4o, gpt-4o-mini, gpt-3.5-turbo |
| `o1-*` | OpenAI | o1-preview, o1-mini |
| `deepseek-*` | DeepSeek | deepseek-chat, deepseek-coder |
| `claude-*` | Anthropic | claude-3-opus, claude-3-sonnet |

## Switching Providers

To switch providers, simply:

1. Edit your `.env` file
2. Restart the container

```bash
# Example: Switch from OpenAI to DeepSeek
sed -i 's/gpt-4o/deepseek-chat/g' .env
docker-compose restart
```

## Troubleshooting

### Error: "400 This response_format type is unavailable now"

**Cause**: Using OpenAI's `json_schema` format with a model that doesn't support it.

**Solution**: 
- Update to `gpt-4o-2024-08-06` or later
- OR switch to DeepSeek which uses `json_object`

### Verify Configuration

```bash
# Check current configuration
./verify-llm-config.sh

# Test the deployed API
./test-llm-endpoint.sh http://your-server:8718

# Check container's environment
docker exec kedge-backend env | grep LLM_MODEL
```

### Check Logs

```bash
# See which provider is being used
docker logs kedge-backend | grep -i "provider\|model"

# You should see:
# "LLM Service initialized - Model: deepseek-chat, Provider: deepseek"
# "Using deepseek provider with model deepseek-chat for quiz extraction"
```

## Model Recommendations

### For Production (Reliability + Cost)
```env
LLM_MODEL_QUIZ_PARSER=deepseek-chat        # $0.14/M tokens
LLM_MODEL_QUIZ_RENDERER=deepseek-chat      # Fast and cheap
LLM_MODEL_ANSWER_VALIDATOR=deepseek-chat   # Simple validation
LLM_MODEL_KNOWLEDGE_EXTRACTOR=gpt-4o       # Quality for extraction
```

### For Development (Quality)
```env
LLM_MODEL_QUIZ_PARSER=gpt-4o-2024-08-06    # Latest features
LLM_MODEL_QUIZ_RENDERER=gpt-4o-mini        # Good balance
LLM_MODEL_ANSWER_VALIDATOR=gpt-4o-mini     # Fast validation
LLM_MODEL_KNOWLEDGE_EXTRACTOR=gpt-4o       # Best extraction
```

### Budget Option (Lowest cost)
```env
LLM_MODEL_QUIZ_PARSER=deepseek-chat
LLM_MODEL_QUIZ_RENDERER=deepseek-chat
LLM_MODEL_ANSWER_VALIDATOR=deepseek-chat
LLM_MODEL_KNOWLEDGE_EXTRACTOR=deepseek-chat
```

## API Key Security

### Best Practices

1. **Never commit API keys** to git
2. **Use environment files** that are gitignored
3. **Set restrictive permissions**: `chmod 600 .env`
4. **Use secrets management** in production (Docker Secrets, Kubernetes Secrets, etc.)

### Docker Secrets Example

```yaml
version: '3.8'
services:
  backend:
    image: kedge-backend:latest
    secrets:
      - deepseek_api_key
    environment:
      DEEPSEEK_API_KEY_FILE: /run/secrets/deepseek_api_key

secrets:
  deepseek_api_key:
    external: true
```

## Migration Guide

### From Hardcoded OpenAI to DeepSeek

1. Apply code fix (one time):
```bash
# Ensure GptController uses LLMService
grep -q "llmService" packages/apps/api-server/src/app/controllers/gpt.controller.ts || \
  echo "Need to update GptController"
```

2. Update environment:
```bash
# Replace all OpenAI models with DeepSeek
export LLM_MODEL_QUIZ_PARSER=deepseek-chat
export LLM_MODEL_QUIZ_RENDERER=deepseek-chat
export LLM_MODEL_ANSWER_VALIDATOR=deepseek-chat
export LLM_MODEL_KNOWLEDGE_EXTRACTOR=deepseek-chat
```

3. Restart:
```bash
docker-compose restart
```

## Testing

### Test DeepSeek
```bash
curl -X POST https://api.deepseek.com/chat/completions \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Hello"}],
    "response_format": {"type": "json_object"}
  }'
```

### Test Your Backend
```bash
curl -X POST http://localhost:8718/v1/gpt/extract-quiz \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "paragraphs": [{
      "type": "paragraph",
      "content": "Test content here"
    }]
  }'
```

## Summary

- **ONE Docker image** works with ALL providers
- **NO rebuild** needed to switch providers  
- **Automatic detection** based on model name
- **Mix and match** different providers for different tasks
- **Cost optimization** by choosing appropriate models
- **Easy switching** via environment variables

The key is: Build once, deploy anywhere, switch anytime!