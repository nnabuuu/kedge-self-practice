#!/bin/bash

# Helper script to switch between local and remote backend

if [ "$1" = "local" ]; then
    echo "Switching to LOCAL backend..."
    
    # Update frontend-practice
    cat > frontend-practice/.env.local << EOF
# Local development configuration - connects to local backend
VITE_API_BASE_URL=http://localhost:8718
VITE_API_VERSION=v1
EOF
    
    # Update frontend-quiz-parser
    cat > frontend-quiz-parser/.env.local << EOF
# Local development configuration - connects to local backend
VITE_API_BASE_URL=http://localhost:8718
VITE_API_VERSION=v1
EOF
    
    echo "✓ Configured for LOCAL backend (localhost:8718)"
    echo ""
    echo "Make sure your local backend is running:"
    echo "  cd backend && npm run serve"
    
elif [ "$1" = "remote" ]; then
    echo "Switching to REMOTE backend..."
    
    # Update frontend-practice
    cat > frontend-practice/.env.local << EOF
# Local development configuration - connects to remote server
VITE_API_BASE_URL=http://34.31.89.197:8718
VITE_API_VERSION=v1
EOF
    
    # Update frontend-quiz-parser
    cat > frontend-quiz-parser/.env.local << EOF
# Local development configuration - connects to remote server
VITE_API_BASE_URL=http://34.31.89.197:8718
VITE_API_VERSION=v1
EOF
    
    echo "✓ Configured for REMOTE backend (34.31.89.197:8718)"
    echo ""
    echo "Testing connection..."
    if nc -zv 34.31.89.197 8718 2>&1 | grep -q "succeeded"; then
        echo "✓ Remote server is accessible"
    else
        echo "⚠ Cannot connect to remote server"
    fi
    
elif [ "$1" = "status" ]; then
    echo "Current Frontend Configuration:"
    echo "================================"
    echo ""
    
    PRACTICE_ENV="/Users/niex/Documents/GitHub/kedge-self-practice/frontend-practice/.env.local"
    PARSER_ENV="/Users/niex/Documents/GitHub/kedge-self-practice/frontend-quiz-parser/.env.local"
    
    if [ -f "$PRACTICE_ENV" ]; then
        echo "Practice App:"
        grep VITE_API_BASE_URL "$PRACTICE_ENV" | sed 's/^/  /'
    else
        echo "Practice App: Using default configuration"
    fi
    
    echo ""
    
    if [ -f "$PARSER_ENV" ]; then
        echo "Quiz Parser App:"
        grep VITE_API_BASE_URL "$PARSER_ENV" | sed 's/^/  /'
    else
        echo "Quiz Parser App: Using default configuration"
    fi
    
else
    echo "Frontend Backend Switcher"
    echo "========================="
    echo ""
    echo "Usage: ./switch-backend.sh [local|remote|status]"
    echo ""
    echo "Commands:"
    echo "  local   - Connect to local backend (localhost:8718)"
    echo "  remote  - Connect to remote backend (34.31.89.197:8718)"
    echo "  status  - Show current configuration"
    echo ""
    echo "Example:"
    echo "  ./switch-backend.sh remote"
fi