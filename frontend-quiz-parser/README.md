# Frontend Quiz Parser

A React-based application for extracting quiz questions from DOCX files and integrating with the backend REST API.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Start Backend (Required)
In a separate terminal:
```bash
cd ../backend
nx serve api-server
```
Backend will be available at: http://localhost:8718

### 4. Start Frontend
```bash
npm run dev
```
Frontend will be available at: http://localhost:5173

## ✨ Features

- **DOCX File Upload**: Extract content from Word documents
- **Image Support**: Automatically extract and display images
- **Authentication**: JWT-based login system  
- **Quiz Generation**: AI-powered quiz creation
- **Knowledge Point Matching**: Automatic curriculum alignment
- **Backend Integration**: Direct database submission
- **Excel Export**: Export results to spreadsheet

## 🔧 Configuration

### Environment Variables
- `VITE_API_BASE_URL`: Backend API endpoint (default: `http://localhost:8718/v1`)

### Authentication
- Demo credentials: `teacher@example.com` / `password123`
- Or register a new teacher account

## 📋 Usage Steps

1. **Login** - Click the login button and authenticate
2. **Upload** - Drag & drop a DOCX file with highlighted text
3. **Process** - Review extracted content and images
4. **Generate** - Create quiz questions from content
5. **Match** - Assign knowledge points to questions
6. **Submit** - Save to backend database
7. **Export** - Download as Excel file

## 🔧 Backend Integration

This application is now fully integrated with the local backend API and includes:

| Feature | Status |
|---------|--------|
| DOCX Upload & Processing | ✅ |
| Image Extraction & Display | ✅ |
| JWT Authentication | ✅ |
| Database Storage | ✅ |
| Knowledge Point Matching | ✅ |
| Excel Export | ✅ |

## 🛠️ Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📚 Documentation

For detailed setup and API integration information, see:
- [Backend Integration Guide](./README-backend-integration.md)

## 🔗 Related

- Backend API: `../backend/`
- Practice Frontend: `../frontend-practice/`

---

**Note**: Make sure the backend API server is running before starting the frontend for full functionality.