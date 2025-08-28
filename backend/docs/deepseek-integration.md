# DeepSeek LLM Integration Guide

## Overview

The backend now supports **DeepSeek v3** as an alternative to OpenAI GPT models for quiz extraction and processing. The system **automatically detects** which provider to use based on the model name:
- Models starting with `gpt-`, `o1-`, or `chatgpt-` → Use OpenAI
- Models starting with `deepseek-` → Use DeepSeek

DeepSeek offers:
- More cost-effective pricing (approximately 10x cheaper than GPT-4)
- Excellent Chinese language understanding
- Fast response times
- JSON object response format support

## Key Differences

### OpenAI (Default)
- Uses `json_schema` for structured output validation
- Strict schema enforcement
- Higher cost but guaranteed output format
- GPT-4o model by default

### DeepSeek
- Uses `json_object` response format
- Relies on prompt engineering for structure
- Much more cost-effective
- DeepSeek-chat model

## Configuration

### 1. Get DeepSeek API Key
1. Visit https://platform.deepseek.com/
2. Sign up and create an API key
3. Note your API key for configuration

### 2. Configure Environment Variables

Edit `backend/.envrc.override` (create if doesn't exist):

```bash
# Unified configuration - works for any provider
# To use DeepSeek, set model to "deepseek-chat"
# To use OpenAI, set model to "gpt-4o" or "gpt-4o-mini"
export LLM_MODEL_QUIZ_PARSER="deepseek-chat"

# Single API key for any provider
export LLM_API_KEY="your-actual-api-key-here"

# Optional: Override the base URL (auto-detected if not set)
# export LLM_BASE_URL="https://api.deepseek.com"

# Temperature and max_tokens work for all providers
export LLM_TEMP_QUIZ_PARSER="0.7"
export LLM_MAX_TOKENS_QUIZ_PARSER="4000"
```

**Note**: All configuration uses unified `LLM_*` variables:
- `LLM_API_KEY` - Single API key for any provider
- `LLM_MODEL_*` - Model selection (auto-detects provider)
- `LLM_TEMP_*` - Temperature settings
- `LLM_MAX_TOKENS_*` - Token limits
- `LLM_BASE_URL` - Optional base URL override
- `LLM_ORGANIZATION` - Optional organization ID

### 3. Apply Configuration

```bash
cd backend
direnv allow
```

### 4. Restart API Server

```bash
# Stop current server (Ctrl+C)
# Start again
nx run api-server:serve
```

## Verification

### Check Current Provider

```bash
curl http://localhost:8718/v1/docx/llm-provider | jq
```

Expected response when using DeepSeek:
```json
{
  "provider": "DeepSeek v3",
  "features": [
    "Cost-effective",
    "JSON object response format",
    "Good Chinese language support",
    "Fast response times"
  ],
  "currentProvider": "deepseek"
}
```

### Test Quiz Extraction

Upload a DOCX file through the frontend and verify quiz extraction works correctly.

## Switching Between Providers

### Unified Configuration (Recommended)
```bash
# Single API key for any provider
export LLM_API_KEY="your-api-key"

# To use DeepSeek
export LLM_MODEL_QUIZ_PARSER="deepseek-chat"

# To use OpenAI
export LLM_MODEL_QUIZ_PARSER="gpt-4o"

# All other settings use LLM_* prefix
export LLM_TEMP_QUIZ_PARSER="0.7"
export LLM_MAX_TOKENS_QUIZ_PARSER="4000"
```

### Use DeepSeek (Cost-Effective)
```bash
# Simply set any model starting with "deepseek-"
export LLM_MODEL_QUIZ_PARSER="deepseek-chat"
export LLM_API_KEY="your-deepseek-api-key"
# Base URL is auto-detected as https://api.deepseek.com
```

### Use OpenAI (Default, Higher Quality)
```bash
# Use any OpenAI model (gpt-4o, gpt-4o-mini, etc.)
export LLM_MODEL_QUIZ_PARSER="gpt-4o"
export LLM_API_KEY="your-openai-api-key"
# Base URL is auto-detected for OpenAI
```

### Mixed Usage (Different providers for different tasks)
```bash
# Use DeepSeek for quiz parsing (cost-effective)
export LLM_MODEL_QUIZ_PARSER="deepseek-chat"

# Use GPT-4o-mini for answer validation (fast)
export LLM_MODEL_ANSWER_VALIDATOR="gpt-4o-mini"

# Use GPT-4o for knowledge extraction (accurate)
export LLM_MODEL_KNOWLEDGE_EXTRACTOR="gpt-4o"

# Single API key (works if using same account/provider)
export LLM_API_KEY="your-api-key"

# Note: Mixing providers with different API keys requires
# custom configuration and is not directly supported
```

## Cost Comparison

| Provider | Model | Input Cost | Output Cost | Notes |
|----------|-------|------------|-------------|--------|
| OpenAI | GPT-4o | $2.50/1M tokens | $10.00/1M tokens | Best quality, structured output |
| OpenAI | GPT-4o-mini | $0.15/1M tokens | $0.60/1M tokens | Good for simple tasks |
| DeepSeek | DeepSeek-chat | $0.14/1M tokens | $0.28/1M tokens | Excellent Chinese support |

## Environment Variable Summary

### Environment Variables
| Variable | Description | Example |
|----------|-------------|----------|
| `LLM_API_KEY` | Single API key for any provider | `sk-xxx` or `deepseek-xxx` |
| `LLM_BASE_URL` | Override base URL (optional) | `https://api.deepseek.com` |
| `LLM_ORGANIZATION` | Organization ID (optional) | `org-xxx` |
| `LLM_MODEL_QUIZ_PARSER` | Model for quiz extraction | `deepseek-chat` or `gpt-4o` |
| `LLM_TEMP_QUIZ_PARSER` | Temperature for quiz parser | `0.7` |
| `LLM_MAX_TOKENS_QUIZ_PARSER` | Max tokens for quiz parser | `4000` |
| `LLM_MODEL_ANSWER_VALIDATOR` | Model for answer validation | `gpt-4o-mini` |
| `LLM_MODEL_KNOWLEDGE_EXTRACTOR` | Model for knowledge extraction | `gpt-4o` |

## Implementation Details

### Service Architecture

```
LLMService (Unified Interface)
    ├── GptService (OpenAI implementation)
    │   └── Uses json_schema for structured output
    └── DeepSeekService (DeepSeek implementation)
        └── Uses json_object with prompt engineering
```

### How It Works

1. **LLMService** checks the model name prefix (e.g., "gpt-" or "deepseek-")
2. Automatically routes requests to appropriate service
3. Auto-configures the base URL based on provider (unless overridden)
4. Uses unified `LLM_API_KEY` for authentication (with fallback to provider-specific keys)
5. Each service handles its specific API format:
   - OpenAI: Structured output with schema validation
   - DeepSeek: JSON object with example-based prompting

No need to set a separate provider flag or manage multiple API keys - just set the model name and one API key!

### DeepSeek Prompt Strategy

Since DeepSeek doesn't support `json_schema`, we use:
1. Clear JSON examples in the system prompt
2. Explicit output format instructions
3. Post-processing validation and retry logic

## Troubleshooting

### Issue: Empty responses from DeepSeek
- **Solution**: Modify prompt to be more explicit about JSON output
- Check API key is valid
- Ensure sufficient credits in DeepSeek account

### Issue: Malformed JSON output
- **Solution**: The service includes JSON extraction logic
- Automatically retries for fill-in-the-blank questions without blanks
- Falls back to empty array if parsing fails

### Issue: Provider not switching
1. Check that your model name starts with the correct prefix:
   - DeepSeek models: `deepseek-chat`, `deepseek-coder`, etc.
   - OpenAI models: `gpt-4o`, `gpt-4o-mini`, etc.
2. Ensure `.envrc.override` has the correct API key for your provider
3. Run `direnv allow` in backend directory
4. Restart the API server
5. Verify with `/v1/docx/llm-provider` endpoint

## Best Practices

1. **Development**: Use DeepSeek for cost-effective testing
2. **Production**: Consider OpenAI for guaranteed output quality
3. **Chinese Content**: DeepSeek often performs better for Chinese quiz extraction
4. **Complex Documents**: OpenAI GPT-4o handles edge cases better

## API Endpoints

### Check Provider
```
GET /v1/docx/llm-provider
```

### Extract Quiz (Uses configured provider)
```
POST /v1/docx/extract-quiz-with-images
```

Both endpoints automatically use the configured LLM provider.