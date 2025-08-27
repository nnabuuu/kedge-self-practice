# OpenAI Model Configuration Guide

## Overview

The Kedge platform now supports configurable OpenAI models for different use cases, allowing you to optimize for performance, cost, and accuracy based on specific needs.

## Use Cases and Recommended Models

### 1. Quiz Parser (`quizParser`)
**Purpose**: Extract quiz items from documents (DOCX files)
**Complexity**: High - requires understanding context, formatting, and educational content
**Recommended Model**: `gpt-4o` (default)
**Alternative Models**: 
- `gpt-4-turbo-preview` - Latest GPT-4 with improved capabilities
- `gpt-4` - Stable version with consistent performance

### 2. Quiz Renderer (`quizRenderer`)
**Purpose**: Polish and format quiz questions
**Complexity**: Medium - primarily formatting and minor text adjustments
**Recommended Model**: `gpt-4o-mini` (default)
**Alternative Models**:
- `gpt-3.5-turbo` - Cost-effective for simpler tasks
- `gpt-4o` - When higher quality polish is needed

### 3. Answer Validator (`answerValidator`)
**Purpose**: Validate fill-in-the-blank answers semantically
**Complexity**: Medium - semantic understanding and comparison
**Recommended Model**: `gpt-4o-mini` (default)
**Alternative Models**:
- `gpt-3.5-turbo` - Faster validation with acceptable accuracy
- `gpt-4o` - When dealing with complex or nuanced answers

### 4. Knowledge Point Extractor (`knowledgePointExtractor`)
**Purpose**: Extract keywords and match knowledge points
**Complexity**: High - requires understanding educational taxonomy
**Recommended Model**: `gpt-4o` (default)
**Alternative Models**:
- `gpt-4-turbo-preview` - Better at understanding complex relationships
- `gpt-4` - Stable extraction with good accuracy

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Basic OpenAI Configuration
OPENAI_API_KEY="sk-..."
OPENAI_BASE_URL="https://api.openai.com/v1"  # Optional: for custom endpoints
OPENAI_ORGANIZATION="org-..."  # Optional: if using organization

# Model-Specific Configuration
# Quiz Parser
OPENAI_MODEL_QUIZ_PARSER="gpt-4o"
OPENAI_TEMP_QUIZ_PARSER="0.7"
OPENAI_MAX_TOKENS_QUIZ_PARSER="4000"

# Quiz Renderer
OPENAI_MODEL_QUIZ_RENDERER="gpt-4o-mini"
OPENAI_TEMP_QUIZ_RENDERER="0.3"
OPENAI_MAX_TOKENS_QUIZ_RENDERER="1000"

# Answer Validator
OPENAI_MODEL_ANSWER_VALIDATOR="gpt-4o-mini"
OPENAI_TEMP_ANSWER_VALIDATOR="0.3"
OPENAI_MAX_TOKENS_ANSWER_VALIDATOR="500"

# Knowledge Point Extractor
OPENAI_MODEL_KNOWLEDGE_EXTRACTOR="gpt-4o"
OPENAI_TEMP_KNOWLEDGE_EXTRACTOR="0.3"
OPENAI_MAX_TOKENS_KNOWLEDGE_EXTRACTOR="1000"
```

### Temperature Guidelines

- **0.0-0.3**: Consistent, deterministic outputs (validation, extraction)
- **0.4-0.6**: Balanced creativity and consistency (formatting)
- **0.7-1.0**: More creative outputs (content generation)

### Token Limits

- **Quiz Parser**: 4000 tokens (handles large document sections)
- **Quiz Renderer**: 1000 tokens (formatting existing content)
- **Answer Validator**: 500 tokens (quick validation responses)
- **Knowledge Extractor**: 1000 tokens (keyword and taxonomy extraction)

## Cost Optimization

### Model Pricing (as of 2024)

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Best For |
|-------|----------------------|------------------------|----------|
| gpt-4o | $5.00 | $15.00 | Complex tasks requiring highest accuracy |
| gpt-4o-mini | $0.15 | $0.60 | Most tasks with good accuracy/cost balance |
| gpt-4-turbo | $10.00 | $30.00 | Legacy complex tasks |
| gpt-3.5-turbo | $0.50 | $1.50 | Simple formatting tasks |

### Optimization Strategies

1. **Use gpt-4o-mini for most tasks**: It provides excellent performance at a fraction of the cost
2. **Reserve gpt-4o for complex parsing**: Only use for initial document parsing where accuracy is critical
3. **Batch similar requests**: Reduce overhead by processing multiple items together
4. **Cache responses**: Store validated answers to avoid repeated API calls

## Using Custom Endpoints

For using Azure OpenAI or other compatible endpoints:

```bash
OPENAI_BASE_URL="https://your-resource.openai.azure.com"
OPENAI_API_KEY="your-azure-api-key"
OPENAI_ORGANIZATION=""  # Not needed for Azure

# Model names might be different in Azure
OPENAI_MODEL_QUIZ_PARSER="gpt-4o-deployment-name"
```

## Monitoring and Debugging

### Check Current Configuration

```typescript
import { getOpenAIConfig } from '@kedge/configs';

const config = getOpenAIConfig();
console.log('Current models:', config.models);
```

### Log Token Usage

The system automatically logs token usage for monitoring:

```typescript
// In logs, look for:
// "Token usage for quizParser: 1234 input, 567 output"
```

### Fallback Behavior

If a model is not available or returns an error:
1. The system logs the error
2. Returns a structured error response
3. Does not fall back to a different model (to maintain predictability)

## Migration from Previous Version

The previous version used hardcoded models:
- All tasks used `gpt-4o` or `gpt-4o-mini`
- No temperature control
- No token limit configuration

To migrate:
1. Add the environment variables to your `.env` file
2. Restart the application
3. Monitor logs to ensure models are being used correctly

## Troubleshooting

### Common Issues

1. **"Model not found" error**
   - Check if the model name is correct
   - Verify your API key has access to the model
   - Try using a different model

2. **High costs**
   - Review which use cases are using expensive models
   - Consider downgrading non-critical tasks to gpt-4o-mini
   - Monitor token usage in logs

3. **Timeout errors**
   - Reduce MAX_TOKENS for the specific use case
   - Consider using a faster model (gpt-4o-mini or gpt-3.5-turbo)

4. **Inconsistent results**
   - Lower the temperature for more consistency
   - Ensure the model is appropriate for the task complexity

## Best Practices

1. **Start with defaults**: The default configuration is optimized for most use cases
2. **Monitor and adjust**: Use logs to understand usage patterns before optimizing
3. **Test changes**: When changing models, test with sample data first
4. **Document changes**: Keep track of why specific models were chosen
5. **Regular review**: Model capabilities and pricing change; review quarterly

## Future Enhancements

Planned improvements:
- Automatic fallback to cheaper models on rate limits
- Dynamic model selection based on content complexity
- Usage analytics dashboard
- Cost tracking per use case
- Fine-tuned models for specific educational content