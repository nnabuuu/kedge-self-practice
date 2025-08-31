#!/bin/bash

echo "=========================================="
echo "LLM CONFIGURATION VERIFICATION"
echo "=========================================="
echo ""

# Load environment variables
if [ -f .envrc ]; then
    source .envrc
fi

if [ -f .envrc.override ]; then
    source .envrc.override
fi

# Function to detect provider from model name
detect_provider() {
    local model=$1
    if [[ $model == gpt-* ]] || [[ $model == o1-* ]] || [[ $model == chatgpt-* ]]; then
        echo "openai"
    elif [[ $model == deepseek-* ]]; then
        echo "deepseek"
    elif [[ $model == claude-* ]]; then
        echo "anthropic"
    else
        echo "unknown"
    fi
}

# Display current configuration
echo "Current LLM Configuration:"
echo "--------------------------"
echo ""
echo "Quiz Parser Model:      ${LLM_MODEL_QUIZ_PARSER:-not set}"
echo "  Provider:            $(detect_provider "${LLM_MODEL_QUIZ_PARSER:-}")"
echo ""
echo "Quiz Renderer Model:    ${LLM_MODEL_QUIZ_RENDERER:-not set}"
echo "  Provider:            $(detect_provider "${LLM_MODEL_QUIZ_RENDERER:-}")"
echo ""
echo "Answer Validator Model: ${LLM_MODEL_ANSWER_VALIDATOR:-not set}"
echo "  Provider:            $(detect_provider "${LLM_MODEL_ANSWER_VALIDATOR:-}")"
echo ""
echo "Knowledge Extractor:    ${LLM_MODEL_KNOWLEDGE_EXTRACTOR:-not set}"
echo "  Provider:            $(detect_provider "${LLM_MODEL_KNOWLEDGE_EXTRACTOR:-}")"
echo ""

# Check API keys
echo "API Keys Status:"
echo "----------------"
echo ""

# Check OpenAI
if [ -n "$OPENAI_API_KEY" ]; then
    echo "✓ OpenAI API Key:     Set (${#OPENAI_API_KEY} chars)"
    echo "  Base URL:           ${OPENAI_BASE_URL:-https://api.openai.com/v1}"
else
    echo "✗ OpenAI API Key:     Not set"
fi

# Check DeepSeek
if [ -n "$DEEPSEEK_API_KEY" ]; then
    echo "✓ DeepSeek API Key:   Set (${#DEEPSEEK_API_KEY} chars)"
    echo "  Base URL:           ${DEEPSEEK_BASE_URL:-https://api.deepseek.com}"
else
    echo "✗ DeepSeek API Key:   Not set"
fi

echo ""

# Verify provider/key matching
echo "Configuration Validation:"
echo "-------------------------"
echo ""

ERRORS=0
WARNINGS=0

# Check each model
for var in LLM_MODEL_QUIZ_PARSER LLM_MODEL_QUIZ_RENDERER LLM_MODEL_ANSWER_VALIDATOR LLM_MODEL_KNOWLEDGE_EXTRACTOR; do
    model=${!var}
    if [ -n "$model" ]; then
        provider=$(detect_provider "$model")
        
        case $provider in
            openai)
                if [ -z "$OPENAI_API_KEY" ]; then
                    echo "✗ ERROR: $var uses OpenAI ($model) but OPENAI_API_KEY is not set"
                    ERRORS=$((ERRORS + 1))
                else
                    echo "✓ $var: $model (OpenAI configured)"
                fi
                ;;
            deepseek)
                if [ -z "$DEEPSEEK_API_KEY" ]; then
                    echo "✗ ERROR: $var uses DeepSeek ($model) but DEEPSEEK_API_KEY is not set"
                    ERRORS=$((ERRORS + 1))
                else
                    echo "✓ $var: $model (DeepSeek configured)"
                fi
                ;;
            *)
                echo "⚠ WARNING: $var has unknown provider for model: $model"
                WARNINGS=$((WARNINGS + 1))
                ;;
        esac
    else
        echo "⚠ WARNING: $var is not set"
        WARNINGS=$((WARNINGS + 1))
    fi
done

echo ""
echo "=========================================="
echo "TEST API CONNECTIONS"
echo "=========================================="
echo ""

# Test DeepSeek if configured
if [ -n "$DEEPSEEK_API_KEY" ] && [[ "${LLM_MODEL_QUIZ_PARSER}" == deepseek-* ]]; then
    echo "Testing DeepSeek API..."
    response=$(curl -s -w "\n%{http_code}" -X POST "${DEEPSEEK_BASE_URL:-https://api.deepseek.com}/chat/completions" \
        -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
            "model": "deepseek-chat",
            "messages": [{"role": "user", "content": "Say OK"}],
            "max_tokens": 10
        }' 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n 1)
    
    if [ "$http_code" = "200" ]; then
        echo "✓ DeepSeek API: Connected successfully"
    else
        echo "✗ DeepSeek API: Failed (HTTP $http_code)"
        echo "  Check your DEEPSEEK_API_KEY and DEEPSEEK_BASE_URL"
    fi
fi

# Test OpenAI if configured
if [ -n "$OPENAI_API_KEY" ] && [[ "${LLM_MODEL_QUIZ_PARSER}" == gpt-* ]]; then
    echo "Testing OpenAI API..."
    response=$(curl -s -w "\n%{http_code}" -X POST "${OPENAI_BASE_URL:-https://api.openai.com/v1}/chat/completions" \
        -H "Authorization: Bearer $OPENAI_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": "Say OK"}],
            "max_tokens": 10
        }' 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n 1)
    
    if [ "$http_code" = "200" ]; then
        echo "✓ OpenAI API: Connected successfully"
    else
        echo "✗ OpenAI API: Failed (HTTP $http_code)"
        echo "  Check your OPENAI_API_KEY"
    fi
fi

echo ""
echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo ""

if [ $ERRORS -gt 0 ]; then
    echo "❌ Configuration has $ERRORS error(s) - Please fix before deploying"
elif [ $WARNINGS -gt 0 ]; then
    echo "⚠️  Configuration has $WARNINGS warning(s) - Review recommended"
else
    echo "✅ Configuration is valid and ready for deployment"
fi

echo ""
echo "To test in Docker:"
echo "------------------"
echo "docker run --rm --env-file .env kedge-backend:latest node -e 'console.log(process.env.LLM_MODEL_QUIZ_PARSER)'"
echo ""
echo "=========================================="