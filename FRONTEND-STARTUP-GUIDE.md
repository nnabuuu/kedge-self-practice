# 🚀 Frontend Applications Startup Guide

This guide shows you how to start both frontend applications in the kedge-self-practice project.

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or pnpm
- Backend API server (for full functionality)

## 🎯 Quick Start - All Services

### Option 1: Start Everything at Once

```bash
# Terminal 1: Start Backend API
cd backend
nx serve api-server

# Terminal 2: Start Quiz Parser Frontend  
cd frontend-quiz-parser
npm install
npm run dev

# Terminal 3: Start Practice Frontend (optional)
cd frontend-practice
npm install  
npm run dev
```

### Option 2: Using Scripts (if available)

```bash
# One-line setup for quiz parser
cd frontend-quiz-parser && npm run setup && npm run dev

# One-line setup for practice app
cd frontend-practice && npm install && npm run dev
```

## 📱 Individual Application Setup

### 1. Frontend Quiz Parser (Teacher Tool)

**Purpose**: Upload DOCX files, extract quiz questions, manage content

```bash
cd frontend-quiz-parser

# Install dependencies
npm install

# Setup environment (creates .env file)
cp .env.example .env

# Start development server
npm run dev
```

**Access**: http://localhost:5173
**Login**: teacher@example.com / password123

### 2. Frontend Practice (Student Tool) 

**Purpose**: Students practice quizzes, track progress

```bash
cd frontend-practice

# Install dependencies
npm install

# Start development server  
npm run dev
```

**Access**: http://localhost:5174 (or next available port)

## 🔧 Backend Requirements

### Start Backend API (Required for full features)

```bash
cd backend

# Install dependencies (if not done)
pnpm install

# Start API server
nx serve api-server
```

**Backend Access**: http://localhost:8718
**API Endpoints**: http://localhost:8718/api/v1/
**Swagger Docs**: http://localhost:8718/swagger-ui

### Database Services (if needed)

```bash
# Start PostgreSQL and Redis (if using Docker)
cd backend/packages/dev/database
docker-compose up -d

# Check database status
hasura migrate status --endpoint http://localhost:28717 --admin-secret hasura
```

## 🌟 Feature Overview

### Frontend Quiz Parser Features
- ✅ DOCX file upload with image extraction
- ✅ AI-powered quiz generation  
- ✅ Knowledge point matching
- ✅ Direct backend database submission
- ✅ Excel export functionality
- ✅ JWT authentication

### Frontend Practice Features  
- ✅ Student quiz practice interface
- ✅ Subject selection (History, Biology)
- ✅ Practice configuration options
- ✅ Progress tracking and analytics
- ✅ Practice history
- ✅ Teacher dashboard

## 🔗 Application URLs

| Application | Development URL | Production Port |
|------------|----------------|-----------------|
| Backend API | http://localhost:8718 | 8718 |
| Quiz Parser | http://localhost:5173 | 5173 |
| Practice App | http://localhost:5174 | 5174 |
| Database (Hasura) | http://localhost:28717 | 28717 |

## 🛠️ Troubleshooting

### Port Conflicts
```bash
# Check what's running on ports
lsof -i :5173
lsof -i :8718

# Kill processes if needed
kill -9 <PID>
```

### Environment Issues
```bash
# Verify .env files exist
ls frontend-quiz-parser/.env
ls frontend-practice/.env

# Check environment variables
cd frontend-quiz-parser && cat .env
```

### Backend Connection Issues
```bash
# Test backend is running
curl http://localhost:8718/api/v1/health

# Check backend logs
cd backend && nx serve api-server --verbose
```

### Dependency Issues
```bash
# Clear and reinstall
cd frontend-quiz-parser
rm -rf node_modules package-lock.json
npm install

cd frontend-practice  
rm -rf node_modules package-lock.json
npm install
```

## 📝 Development Workflow

1. **Start Backend First**: `cd backend && nx serve api-server`
2. **Start Frontend(s)**: Choose the app you want to work on
3. **Login** (Quiz Parser only): Use teacher credentials
4. **Develop**: Make changes and see hot reload
5. **Test**: Upload files, create content, practice quizzes

## 📞 Support

- **Documentation**: Check individual README files in each directory
- **Backend Issues**: See `backend/README.md`  
- **Frontend Issues**: Check browser console and network tab
- **API Issues**: Visit http://localhost:8718/swagger-ui for API docs

---

**Happy coding!** 🎉