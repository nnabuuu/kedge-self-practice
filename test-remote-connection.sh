#!/bin/bash

echo "=========================================="
echo "Testing Connection to Remote Server"
echo "=========================================="
echo ""

REMOTE_SERVER="34.31.89.197"
PORT="8718"
BASE_URL="http://${REMOTE_SERVER}:${PORT}"

echo "Server: ${BASE_URL}"
echo ""

# Test 1: Basic connectivity
echo "1. Testing basic connectivity..."
echo "---------------------------------"
if nc -zv ${REMOTE_SERVER} ${PORT} 2>&1 | grep -q "succeeded"; then
    echo "✓ Port ${PORT} is open"
else
    echo "✗ Cannot connect to port ${PORT}"
    echo "  Check if the backend is running on the remote server"
    exit 1
fi

echo ""

# Test 2: Health check
echo "2. Testing health endpoint..."
echo "------------------------------"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/health" 2>/dev/null)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Health check passed"
    echo "  Response: $BODY"
else
    echo "✗ Health check failed (HTTP $HTTP_CODE)"
    echo "  Response: $BODY"
fi

echo ""

# Test 3: API version endpoint
echo "3. Testing API version..."
echo "-------------------------"
VERSION_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/v1" 2>/dev/null)
HTTP_CODE=$(echo "$VERSION_RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo "✓ API v1 endpoint accessible"
else
    echo "✗ API v1 endpoint not accessible (HTTP $HTTP_CODE)"
fi

echo ""

# Test 4: CORS headers (important for frontend)
echo "4. Testing CORS configuration..."
echo "---------------------------------"
CORS_RESPONSE=$(curl -s -I -X OPTIONS "${BASE_URL}/v1/auth/login" \
    -H "Origin: http://localhost:5173" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" 2>/dev/null)

if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-origin"; then
    echo "✓ CORS headers present"
    echo "$CORS_RESPONSE" | grep -i "access-control" | head -3
else
    echo "⚠ CORS headers might not be configured"
    echo "  You may encounter CORS errors when connecting from frontend"
fi

echo ""
echo "=========================================="
echo "Frontend Connection Instructions"
echo "=========================================="
echo ""
echo "Your frontend apps are configured to connect to: ${BASE_URL}"
echo ""
echo "To start the frontend applications:"
echo ""
echo "1. Practice App:"
echo "   cd frontend-practice"
echo "   npm run dev"
echo "   Open: http://localhost:5173"
echo ""
echo "2. Quiz Parser App:"
echo "   cd frontend-quiz-parser"
echo "   npm run dev"
echo "   Open: http://localhost:5174"
echo ""
echo "Note: If you encounter CORS errors, the backend needs to be configured"
echo "to allow requests from your local development URLs."
echo ""
echo "=========================================="