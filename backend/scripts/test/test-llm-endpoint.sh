#!/bin/bash

echo "=========================================="
echo "TEST LLM ENDPOINT"
echo "=========================================="
echo ""
echo "This script tests your deployed backend to verify"
echo "which LLM provider is actually being used."
echo ""

# Configuration
BACKEND_URL="${1:-http://localhost:8718}"
JWT_TOKEN="${2:-}"

echo "Backend URL: $BACKEND_URL"
echo ""

# Test 1: Health check
echo "1. Testing health endpoint..."
echo "------------------------------"
curl -s "$BACKEND_URL/health" | jq '.' 2>/dev/null || echo "Health check failed"
echo ""

# Test 2: Test quiz extraction (requires auth)
if [ -n "$JWT_TOKEN" ]; then
    echo "2. Testing quiz extraction with sample data..."
    echo "-----------------------------------------------"
    
    response=$(curl -s -X POST "$BACKEND_URL/v1/gpt/extract-quiz" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -d '{
            "paragraphs": [{
                "type": "paragraph",
                "content": "The capital of France is Paris. The Eiffel Tower was built in 1889."
            }]
        }')
    
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    # Check response for provider hints
    if echo "$response" | grep -q "deepseek"; then
        echo ""
        echo "✓ Response suggests DeepSeek is being used"
    elif echo "$response" | grep -q "gpt"; then
        echo ""
        echo "✓ Response suggests OpenAI is being used"
    fi
else
    echo "2. Skipping authenticated test (no JWT token provided)"
    echo ""
    echo "To test with authentication, run:"
    echo "  $0 $BACKEND_URL your-jwt-token"
fi

echo ""
echo "3. Checking container logs for LLM info..."
echo "-------------------------------------------"
echo "Run this on your server:"
echo ""
echo "docker logs kedge-backend 2>&1 | grep -i 'LLM\\|deepseek\\|openai\\|model' | tail -20"
echo ""
echo "You should see lines like:"
echo "  'LLM Service initialized - Model: deepseek-chat, Provider: deepseek'"
echo "  'Using deepseek provider with model deepseek-chat for quiz extraction'"
echo ""

echo "=========================================="
echo "QUICK PROVIDER TEST COMMANDS"
echo "=========================================="
echo ""
echo "# Check which provider the backend will use:"
echo "docker exec kedge-backend node -e \"
const model = process.env.LLM_MODEL_QUIZ_PARSER || 'not-set';
const provider = model.startsWith('gpt-') ? 'openai' : 
                 model.startsWith('deepseek-') ? 'deepseek' : 
                 'unknown';
console.log('Model:', model);
console.log('Provider:', provider);
\""
echo ""
echo "# Check all LLM environment variables:"
echo "docker exec kedge-backend env | grep -E 'LLM_MODEL|DEEPSEEK|OPENAI' | sort"
echo ""
echo "=========================================="