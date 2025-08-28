#!/bin/bash

# Test script for DeepSeek LLM integration
# This script tests the LLM provider endpoint to verify model-based provider detection

echo "=== LLM Provider Auto-Detection Test ==="
echo ""

# Check current LLM provider
echo "1. Checking current LLM provider and model..."
curl -s http://localhost:8718/v1/docx/llm-provider | jq '.'
echo ""

# Show current model configuration
echo "2. Current model configuration:"
echo "   LLM_MODEL_QUIZ_PARSER: ${LLM_MODEL_QUIZ_PARSER:-${OPENAI_MODEL_QUIZ_PARSER:-gpt-4o (default)}}"
echo ""

# Check unified API key
echo "   Unified Configuration:"
if [ -n "$LLM_API_KEY" ] && [ "$LLM_API_KEY" != "your-llm-api-key-here" ]; then
    echo "   → LLM_API_KEY: [configured]"
else
    echo "   → LLM_API_KEY: [NOT configured]"
fi
if [ -n "$LLM_BASE_URL" ]; then
    echo "   → LLM_BASE_URL: $LLM_BASE_URL"
else
    echo "   → LLM_BASE_URL: [auto-detected based on model]"
fi
echo ""

# Detect provider based on model
MODEL="${LLM_MODEL_QUIZ_PARSER:-${OPENAI_MODEL_QUIZ_PARSER:-gpt-4o}}"
if [[ "$MODEL" == deepseek-* ]]; then
    echo "   → Provider: DeepSeek (auto-detected from model prefix)"
    # Check for API key (unified or legacy)
    if [ -n "$LLM_API_KEY" ] && [ "$LLM_API_KEY" != "your-llm-api-key-here" ]; then
        echo "   → API Key: Using LLM_API_KEY"
    elif [ -n "$DEEPSEEK_API_KEY" ] && [ "$DEEPSEEK_API_KEY" != "your-deepseek-api-key-here" ]; then
        echo "   → API Key: Using DEEPSEEK_API_KEY (legacy)"
    else
        echo "   → API Key: [NOT configured - set LLM_API_KEY in .envrc.override]"
    fi
else
    echo "   → Provider: OpenAI (auto-detected from model prefix)"
    # Check for API key (unified or legacy)
    if [ -n "$LLM_API_KEY" ] && [ "$LLM_API_KEY" != "your-llm-api-key-here" ]; then
        echo "   → API Key: Using LLM_API_KEY"
    elif [ -n "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "your-actual-openai-api-key-here" ]; then
        echo "   → API Key: Using OPENAI_API_KEY (legacy)"
    else
        echo "   → API Key: [NOT configured - set LLM_API_KEY in .envrc.override]"
    fi
fi
echo ""

# Test instructions
echo "3. To switch providers, simply change the model:"
echo ""
echo "   Unified Configuration (Recommended):"
echo "   export LLM_API_KEY=\"your-api-key\""
echo "   export LLM_MODEL_QUIZ_PARSER=\"deepseek-chat\"  # or \"gpt-4o\""
echo ""
echo "   For DeepSeek (cost-effective):"
echo "   export LLM_MODEL_QUIZ_PARSER=\"deepseek-chat\""
echo "   export LLM_API_KEY=\"your-deepseek-api-key\""
echo ""
echo "   For OpenAI (higher quality):"
echo "   export LLM_MODEL_QUIZ_PARSER=\"gpt-4o\""
echo "   export LLM_API_KEY=\"your-openai-api-key\""
echo ""
echo "   Add these to backend/.envrc.override, then run:"
echo "   direnv allow && restart the API server"
echo ""

echo "=== End Test ==="