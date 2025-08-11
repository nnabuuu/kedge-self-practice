# Frontend Quiz Parser - Backend Integration Guide

## Features Added

### 1. Environment Variable Support
- Uses `VITE_API_BASE_URL` environment variable for API endpoint configuration
- Default: `http://localhost:8718/api/v1`
- Configure in `.env` file

### 2. Image Support
- Extracts images from DOCX files
- Displays images inline in quiz questions and options
- Replaces `{{img:N}}` placeholders with actual images
- Click images to view full size

### 3. Authentication
- JWT-based authentication with login/register modal
- Token management for API requests
- Teacher role by default for quiz management

### 4. Local Backend Integration
- Toggle between local backend and external API
- Full CRUD operations for quizzes
- Batch submission with knowledge point association
- Image upload support

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or pnpm
- Backend API server running on port 8718

### 1. Navigate to Frontend Directory

```bash
cd frontend-quiz-parser
```

### 2. Configure Environment

Create a `.env` file in the frontend-quiz-parser directory:

```bash
# Copy the example file
cp .env.example .env

# Or create manually with this content:
echo "VITE_API_BASE_URL=http://localhost:8718/api/v1" > .env
```

### 3. Install Dependencies

```bash
# Using npm
npm install

# Or using pnpm (if available)
pnpm install
```

### 4. Start Backend Services (Required for Full Features)

Ensure the backend is running in a separate terminal:

```bash
# Navigate to backend directory
cd ../backend

# Start the API server
nx serve api-server

# You should see:
# Local:   http://localhost:8718/
# API endpoints available at: http://localhost:8718/api/v1/
```

### 5. Start Frontend Development Server

```bash
# In the frontend-quiz-parser directory
npm run dev

# You should see output like:
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

### 6. Open in Browser

Navigate to: **http://localhost:5173**

## Quick Start Commands

```bash
# Complete startup sequence
cd frontend-quiz-parser
npm install
npm run dev

# In another terminal for backend
cd backend
nx serve api-server
```

## Usage

### Authentication
1. Click "登录" button in the header
2. Use demo credentials or register a new account:
   - Email: `teacher@example.com`
   - Password: `password123`

### Upload and Process Documents
1. Toggle "使用本地后端" to enable local backend features
2. Upload a DOCX file with highlighted text
3. Images in the document will be extracted automatically
4. Process through the workflow:
   - Upload → Parse → Generate Quiz → Match Knowledge Points → Submit

### Image Display
- Images are displayed inline in quiz questions
- Click on any image to view full size
- Images are stored securely on the backend

## API Endpoints Used

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### DOCX Processing
- `POST /docx/extract-quiz-with-images` - Extract content and images

### Quiz Management
- `POST /quiz/submit-with-images` - Submit quiz with attachments
- `POST /quiz/batch-with-knowledge-points` - Batch submit with knowledge points

### Knowledge Points
- `GET /knowledge-points` - List all knowledge points
- `POST /knowledge-points/match` - Match quiz to knowledge points

## File Structure

```
src/
├── services/
│   ├── api.ts                 # Base API configuration and auth
│   ├── localQuizService.ts    # Local backend integration
│   └── quizService.ts         # External API (fallback)
├── components/
│   ├── AuthModal.tsx          # Authentication modal
│   ├── QuizImageDisplay.tsx   # Image display component
│   └── QuizDisplay.tsx        # Updated with image support
└── App-updated.tsx            # Main app with backend integration
```

## Features Comparison

| Feature | External API | Local Backend |
|---------|-------------|--------------|
| Upload DOCX | ✅ | ✅ |
| Extract Highlights | ✅ | ✅ |
| Extract Images | ❌ | ✅ |
| Generate Quiz | ✅ | ✅ |
| Authentication | ❌ | ✅ |
| Save to Database | ❌ | ✅ |
| Knowledge Points | ✅ | ✅ |
| Batch Processing | ❌ | ✅ |

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure the backend allows requests from your frontend URL:
- Default frontend: `http://localhost:5173`
- Configure CORS in backend if needed

### Authentication Errors
- Token expires after session
- Re-login if you see 401 errors
- Check backend is running on correct port

### Image Display Issues
- Ensure backend serves static files correctly
- Check `/attachments/` routes are accessible
- Verify JWT token is included in image requests

## Next Steps

1. **Production Deployment**
   - Update `VITE_API_BASE_URL` for production
   - Configure HTTPS for secure connections
   - Set up proper authentication persistence

2. **Enhanced Features**
   - Add progress tracking for batch operations
   - Implement quiz editing after submission
   - Add quiz preview before final submission

3. **Performance Optimization**
   - Lazy load images
   - Implement image compression
   - Add caching for knowledge points