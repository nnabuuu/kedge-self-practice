#!/bin/bash

echo "=========================================="
echo "BUILD UNIVERSAL DOCKER IMAGE"
echo "=========================================="
echo ""
echo "This builds ONE image that works with ALL models (OpenAI, DeepSeek, etc.)"
echo "Model selection happens at RUNTIME via environment variables"
echo ""

# Configuration
IMAGE_NAME="kedge-backend"
IMAGE_TAG="${1:-latest}"
REGISTRY="${DOCKER_REGISTRY:-}"
PLATFORM="linux/amd64"  # For x86_64 VMs

echo "Configuration:"
echo "  Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "  Platform: ${PLATFORM}"
echo "  Registry: ${REGISTRY:-none}"
echo ""

# Step 1: Verify code fix is applied
echo "Step 1: Verifying code is ready..."
echo "-----------------------------------"

if grep -q "llmService.extractQuizItems" packages/apps/api-server/src/app/controllers/gpt.controller.ts; then
    echo "✓ Code is using LLMService (supports all models)"
else
    echo "⚠ Warning: GptController is not using LLMService"
    echo "  The code will still work but may not auto-detect DeepSeek"
fi

# Step 2: Build the UNIVERSAL Docker image
echo ""
echo "Step 2: Building Docker image..."
echo "---------------------------------"

docker buildx build \
  --platform="${PLATFORM}" \
  --tag "${IMAGE_NAME}:${IMAGE_TAG}" \
  --file Dockerfile.backend \
  --build-arg NODE_ENV=production \
  .

if [ $? -ne 0 ]; then
    echo "✗ Docker build failed"
    exit 1
fi

echo "✓ Docker image built successfully"

# Step 3: Save or push image
if [ -n "${REGISTRY}" ]; then
    echo ""
    echo "Step 3: Pushing to registry..."
    echo "-------------------------------"
    
    FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
    docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "${FULL_IMAGE_NAME}"
    docker push "${FULL_IMAGE_NAME}"
    
    echo "✓ Pushed to ${FULL_IMAGE_NAME}"
else
    echo ""
    echo "Step 3: Saving image for transfer..."
    echo "-------------------------------------"
    
    OUTPUT_FILE="${IMAGE_NAME}-${IMAGE_TAG}.tar.gz"
    docker save "${IMAGE_NAME}:${IMAGE_TAG}" | gzip > "${OUTPUT_FILE}"
    
    echo "✓ Saved to ${OUTPUT_FILE}"
    echo ""
    echo "Transfer to remote VM:"
    echo "  scp ${OUTPUT_FILE} user@your-vm:/path/to/destination/"
    echo ""
    echo "Load on remote VM:"
    echo "  gunzip -c ${OUTPUT_FILE} | docker load"
fi

echo ""
echo "=========================================="
echo "DEPLOYMENT WITH ENVIRONMENT VARIABLES"
echo "=========================================="
echo ""
echo "THE SAME IMAGE WORKS WITH ALL MODELS!"
echo ""
echo "1. Create .env file on your VM:"
echo "--------------------------------"
cat << 'ENV_FILE'
# Database & Core Services
NODE_ENV=production
NODE_DATABASE_URL=postgres://user:pass@host:5432/kedge_db
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your-jwt-secret
HASURA_ENDPOINT=http://hasura:8080
HASURA_SECRET=your-hasura-secret

# File Storage
QUIZ_STORAGE_PATH=/app/uploads/quiz
MAX_FILE_SIZE=104857600

# CHOOSE YOUR LLM PROVIDER BY SETTING MODEL NAMES:
# ==================================================

# Option A: Use OpenAI
# ---------------------
# LLM_MODEL_QUIZ_PARSER=gpt-4o-2024-08-06
# LLM_MODEL_QUIZ_RENDERER=gpt-4o-mini
# LLM_MODEL_ANSWER_VALIDATOR=gpt-4o-mini
# LLM_MODEL_KNOWLEDGE_EXTRACTOR=gpt-4o
# OPENAI_API_KEY=sk-your-openai-key
# OPENAI_BASE_URL=https://api.openai.com/v1

# Option B: Use DeepSeek
# ----------------------
LLM_MODEL_QUIZ_PARSER=deepseek-chat
LLM_MODEL_QUIZ_RENDERER=deepseek-chat
LLM_MODEL_ANSWER_VALIDATOR=deepseek-chat
LLM_MODEL_KNOWLEDGE_EXTRACTOR=deepseek-chat
DEEPSEEK_API_KEY=your-deepseek-key
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Option C: Mix and Match
# ------------------------
# LLM_MODEL_QUIZ_PARSER=deepseek-chat
# LLM_MODEL_QUIZ_RENDERER=gpt-4o-mini
# LLM_MODEL_ANSWER_VALIDATOR=deepseek-chat
# LLM_MODEL_KNOWLEDGE_EXTRACTOR=gpt-4o
# OPENAI_API_KEY=sk-your-openai-key
# DEEPSEEK_API_KEY=your-deepseek-key
ENV_FILE

echo ""
echo "2. Run with docker-compose.yml:"
echo "--------------------------------"
cat << 'COMPOSE_FILE'
version: '3.8'

services:
  backend:
    image: kedge-backend:latest
    container_name: kedge-backend
    restart: unless-stopped
    ports:
      - "8718:8718"
    env_file:
      - .env  # ALL configuration from external file
    volumes:
      - ./uploads:/app/uploads
      - ./data:/app/data
      - ./.env:/app/.env:ro  # Optional: mount env file
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8718/health"]
      interval: 30s
      timeout: 10s
      retries: 3
COMPOSE_FILE

echo ""
echo "3. Or run with docker directly:"
echo "--------------------------------"
cat << 'DOCKER_RUN'
docker run -d \
  --name kedge-backend \
  --restart unless-stopped \
  -p 8718:8718 \
  --env-file .env \
  -v ./uploads:/app/uploads \
  -v ./data:/app/data \
  kedge-backend:latest
DOCKER_RUN

echo ""
echo "=========================================="
echo "HOW IT WORKS"
echo "=========================================="
echo ""
echo "The SAME Docker image automatically detects the LLM provider based on model name:"
echo ""
echo "  - Models starting with 'gpt-' or 'o1-' → Uses OpenAI"
echo "  - Models starting with 'deepseek-' → Uses DeepSeek"
echo "  - Models starting with 'claude-' → Uses Anthropic (if configured)"
echo ""
echo "Just change the LLM_MODEL_* environment variables to switch providers!"
echo "No need to rebuild the image!"
echo ""
echo "=========================================="
echo "SWITCHING MODELS ON THE FLY"
echo "=========================================="
echo ""
echo "To switch from OpenAI to DeepSeek:"
echo "  1. Edit .env file"
echo "  2. docker-compose restart"
echo ""
echo "To switch from DeepSeek to OpenAI:"
echo "  1. Edit .env file"
echo "  2. docker-compose restart"
echo ""
echo "That's it! The same image handles everything!"
echo ""
echo "=========================================="