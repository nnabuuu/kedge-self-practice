# Frontend Practice - Student Quiz Application

A React-based student practice application for the kedge-self-practice learning platform. Students can practice quizzes, track progress, and analyze their performance.

## 🚀 Quick Start

```bash
# Setup with environment configuration
npm run setup

# Or manually install and setup
npm install
cp .env.example .env

# Start development server
npm run dev
```

**Access**: http://localhost:5174 (or next available port)

## 🔑 Authentication

### Backend Authentication (Recommended)
- Uses real JWT authentication with local backend
- **Teacher Demo**: teacher@demo.com / demo123
- **Student Demo**: student@demo.com / demo123
- Registration available for new users

### Teacher Features
- Access to quiz parser via "题库解析器" button
- Seamless token sharing with frontend-quiz-parser
- Teacher dashboard with content management

## ✨ Features

### Student Features
- 📚 Subject selection (History, Biology)
- 🎯 Practice configuration (question types, count, time limits)
- 📊 Interactive quiz interface with progress tracking
- 📈 Results analysis and knowledge point performance
- 📝 Practice history with local storage persistence
- 🔄 Mobile-responsive design

### Teacher Features  
- 👨‍🏫 Teacher dashboard with management tools
- 🔗 One-click navigation to quiz parser (DOCX upload tool)
- 📋 Content management capabilities
- 🔒 JWT token sharing between applications

## 🔧 Environment Configuration

**.env** file settings:
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8718/api/v1

# Development Settings  
VITE_ENABLE_MOCK_API=false
```

## 🏗️ Architecture

### Authentication Flow
1. **Login/Register**: Real backend authentication via `/auth/login` or `/auth/register`
2. **JWT Storage**: Token stored in localStorage for persistence
3. **Cross-App Token Sharing**: Teachers can seamlessly access quiz parser
4. **Automatic Authentication**: Checks for existing tokens on app load

### API Integration
- **Backend Service**: `src/services/authService.ts` - Authentication and token management
- **Quiz Service**: `src/services/backendQuizService.ts` - Quiz data with fallback to mock
- **Cross-Frontend Navigation**: Token sharing mechanism for seamless experience

### Mock Data Fallback
- Graceful degradation when backend is unavailable
- Complete mock data for subjects, quizzes, and knowledge points
- Local storage for practice history and progress

## 🔄 Cross-Frontend Integration

### Token Sharing with Quiz Parser
When teachers click "题库解析器" button:
1. Current JWT token is shared via localStorage
2. Opens frontend-quiz-parser in new tab with token parameter
3. Automatic authentication in quiz parser application
4. Seamless workflow between applications

## 🧪 Development

### Prerequisites
- Node.js (v16 or higher)
- Backend API server running on port 8718 (optional)
- Environment variables configured

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run setup` - Install dependencies and create .env
- `npm run check-env` - Verify environment configuration

### Backend Requirements (Optional)
```bash
# Start backend API server
cd backend
nx serve api-server
```

**Backend Endpoints:**
- Authentication: `/auth/login`, `/auth/register`
- Quiz API: `/quiz/practice`, `/subjects`
- Health check: `/api/v1/health`

## 📱 Usage

### For Students
1. **Login** with student credentials or register new account
2. **Select Subject** (History or Biology)
3. **Configure Practice** - Set question types, count, and options
4. **Practice Quizzes** - Interactive quiz interface with timer
5. **Review Results** - Detailed analysis and progress tracking
6. **View History** - Access past practice sessions

### For Teachers  
1. **Login** with teacher credentials
2. **Access Dashboard** - View student progress and manage content
3. **Use Quiz Parser** - Click "题库解析器" to upload DOCX files
4. **Manage Content** - Create and organize quiz questions

## 🔍 Technical Details

### State Management
- React useState for local component state
- localStorage for persistence (practice history, user data)
- Context-free architecture for simplicity

### Styling
- **TailwindCSS** for utility-first styling  
- **Lucide React** for consistent icons
- **Gradient backgrounds** and modern UI components
- **Responsive design** with mobile-first approach

### Error Handling
- Graceful API failure handling with mock data fallback
- User-friendly error messages and loading states
- Network connectivity checks and retry mechanisms

## 🤝 Integration with Backend

### API Endpoints Used
```typescript
POST /auth/login - User authentication
POST /auth/register - User registration  
GET /subjects - Available subjects
POST /quiz/practice - Get practice quizzes
POST /practice/submit - Submit practice session
```

### Error Handling
- **Network Issues**: Falls back to demo/mock authentication
- **API Failures**: Uses local mock data for quizzes and subjects
- **Token Expiry**: Automatic logout and re-authentication prompt

## 📋 Environment Setup Checklist

- [ ] Node.js installed (v16+)
- [ ] `.env` file created with proper API URLs
- [ ] Backend server running (optional)
- [ ] Dependencies installed via `npm install`
- [ ] Development server started via `npm run dev`

## 🐛 Troubleshooting

### Authentication Issues
```bash
# Check backend connectivity
curl http://localhost:8718/api/v1/health

# Verify environment variables
cat .env
```

### Port Conflicts
```bash
# Check running processes
lsof -i :5174

# Use different port if needed
npm run dev -- --port 5175
```

### Backend Connection
- Ensure backend API is running on port 8718
- Check CORS settings in backend configuration
- Verify API endpoint URLs in .env file

---

**Happy learning!** 📚✨