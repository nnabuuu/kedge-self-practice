# Frontend Configuration Guide

## Current Configuration

Both frontend applications are now configured to connect to the **remote server** at `34.31.89.197:8718`.

## Configuration Files

### For Remote Server (Current Setup)
The `.env.local` files in each frontend directory are configured for the remote server:
```env
VITE_API_BASE_URL=http://34.31.89.197:8718
VITE_API_VERSION=v1
```

### For Local Backend Development
If you want to connect to a local backend instead, update `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:8718
VITE_API_VERSION=v1
```

## Running the Frontend Applications

### 1. Practice Application
```bash
cd frontend-practice
npm install  # First time only
npm run dev
```
- Opens at: http://localhost:5173
- Connected to: http://34.31.89.197:8718

### 2. Quiz Parser Application
```bash
cd frontend-quiz-parser
npm install  # First time only
npm run dev
```
- Opens at: http://localhost:5174
- Connected to: http://34.31.89.197:8718

## Environment File Priority

Vite loads environment files in this order:
1. `.env.local` (local overrides - not committed to git)
2. `.env.development` (development defaults)
3. `.env` (base configuration)

The `.env.local` files are gitignored, so your local configuration won't affect other developers.

## Switching Between Environments

### Quick Switch Script
Create this helper script to easily switch between local and remote:

```bash
#!/bin/bash
# save as: switch-backend.sh

if [ "$1" = "local" ]; then
    echo "Switching to LOCAL backend..."
    echo "VITE_API_BASE_URL=http://localhost:8718" > frontend-practice/.env.local
    echo "VITE_API_VERSION=v1" >> frontend-practice/.env.local
    
    echo "VITE_API_BASE_URL=http://localhost:8718" > frontend-quiz-parser/.env.local
    echo "VITE_API_VERSION=v1" >> frontend-quiz-parser/.env.local
    
    echo "✓ Configured for LOCAL backend (localhost:8718)"
    
elif [ "$1" = "remote" ]; then
    echo "Switching to REMOTE backend..."
    echo "VITE_API_BASE_URL=http://34.31.89.197:8718" > frontend-practice/.env.local
    echo "VITE_API_VERSION=v1" >> frontend-practice/.env.local
    
    echo "VITE_API_BASE_URL=http://34.31.89.197:8718" > frontend-quiz-parser/.env.local
    echo "VITE_API_VERSION=v1" >> frontend-quiz-parser/.env.local
    
    echo "✓ Configured for REMOTE backend (34.31.89.197:8718)"
    
else
    echo "Usage: ./switch-backend.sh [local|remote]"
fi
```

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
1. Check that the backend allows your frontend URL
2. The backend should include these headers:
   - `Access-Control-Allow-Origin: http://localhost:5173` (or `*` for any origin)
   - `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type, Authorization`

### Connection Refused
If the frontend can't connect:
1. Test the backend directly: `curl http://34.31.89.197:8718/health`
2. Check if the port is open: `nc -zv 34.31.89.197 8718`
3. Verify the backend is running on the remote server

### Authentication Issues
When testing authentication:
1. Register a new account first
2. Use the login credentials to get a JWT token
3. The token will be stored in localStorage automatically

## API Endpoints

The frontend will connect to these endpoints:

### Authentication
- POST `/v1/auth/register` - Register new user
- POST `/v1/auth/login` - Login

### Quiz Management
- POST `/v1/docx/extract-quiz` - Extract quiz from DOCX
- GET `/v1/quiz/list` - List quizzes
- POST `/v1/quiz/submit` - Submit new quiz

### Knowledge Points
- GET `/v1/knowledge-points` - Get knowledge points tree
- POST `/v1/knowledge-points/match` - Match quiz to knowledge points

## Current Status

✅ **Remote Server**: `34.31.89.197:8718`
✅ **CORS**: Configured for `http://localhost:5173`
✅ **Frontend Practice**: Configured for remote
✅ **Frontend Quiz Parser**: Configured for remote

You can now run `npm run dev` in either frontend directory and it will connect to the remote backend!