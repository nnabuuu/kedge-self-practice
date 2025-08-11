# Frontend Integration: DOCX Image Support & Enhanced Attachment System

## Overview

The backend has been enhanced with comprehensive image extraction from DOCX files and improved attachment handling. This document outlines the changes frontend needs to implement to support rich quiz content with images.

## 🔄 Breaking Changes & Migration

### 1. Enhanced DOCX Processing Response

**BEFORE** - Old `/docx/extract-quiz` response:
```json
[
  {
    "type": "single-choice",
    "question": "What is shown in the diagram?",
    "options": ["Option A", "Option B"],
    "answer": "Option A"
  }
]
```

**NOW** - New `/docx/extract-quiz-with-images` response:
```json
{
  "success": true,
  "quizItems": [
    {
      "type": "single-choice",
      "question": "What is shown in the diagram? {{img:0}}",
      "options": ["{{img:1}} Option A", "Option B"],
      "answer": "Option A"
    }
  ],
  "extractedImages": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "url": "/attachments/quiz/2024/01/550e8400-diagram.jpg",
      "filename": "diagram.jpg",
      "size": 15360,
      "contentType": "image/jpeg"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001", 
      "url": "/attachments/quiz/2024/01/550e8400-option-a.png",
      "filename": "option-a.png",
      "size": 8192,
      "contentType": "image/png"
    }
  ],
  "paragraphs": [
    {
      "paragraph": "This diagram shows the water cycle process.",
      "highlighted": [
        {"text": "water cycle", "color": "yellow"}
      ],
      "images": [
        {
          "id": "word/media/image1.jpg",
          "filename": "image1.jpg",
          "url": "/attachments/quiz/2024/01/550e8400-diagram.jpg",
          "width": 400,
          "height": 300
        }
      ]
    }
  ],
  "imageMapping": {
    "word/media/image1.jpg": "/attachments/quiz/2024/01/550e8400-diagram.jpg",
    "word/media/image2.png": "/attachments/quiz/2024/01/550e8400-option-a.png"
  }
}
```

### 2. Quiz Submission Response Changes

**BEFORE** - Old quiz submission:
```json
{
  "success": true,
  "data": {
    "type": "single-choice",
    "question": "Question text",
    "options": ["A", "B"],
    "images": ["/absolute/path/to/image.jpg"]
  }
}
```

**NOW** - Enhanced quiz submission:
```json
{
  "success": true,
  "data": {
    "type": "single-choice", 
    "question": "Question text {{img:0}}",
    "options": ["{{img:1}} A", "B"],
    "images": ["/attachments/quiz/2024/01/uuid-image.jpg"]
  },
  "attachments": [
    {
      "id": "uuid-1234",
      "url": "/attachments/quiz/2024/01/uuid-image.jpg",
      "originalName": "diagram.jpg",
      "size": 15360,
      "mimetype": "image/jpeg"
    }
  ]
}
```

## 🔧 Required Frontend Changes

### 1. Update DOCX Upload Component

**Current Implementation:**
```typescript
// OLD: Basic DOCX upload
const uploadDocx = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/v1/docx/extract-quiz', {
    method: 'POST',
    body: formData,
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const quizItems = await response.json();
  setQuizItems(quizItems);
};
```

**Required Update:**
```typescript
// NEW: Enhanced DOCX upload with image support
interface DocxExtractionResponse {
  success: boolean;
  quizItems: QuizItem[];
  extractedImages: ExtractedImage[];
  paragraphs: ParagraphBlock[];
  imageMapping: Record<string, string>;
}

interface ExtractedImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  contentType: string;
}

const uploadDocx = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/v1/docx/extract-quiz-with-images', {
    method: 'POST',
    body: formData,
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data: DocxExtractionResponse = await response.json();
  
  // Store both quiz items and extracted images
  setQuizItems(data.quizItems);
  setExtractedImages(data.extractedImages);
  setImageMapping(data.imageMapping);
};
```

### 2. Image Placeholder Processing

**New Requirement: Handle `{{img:N}}` Placeholders**

```typescript
// Utility function to replace image placeholders
const processImagePlaceholders = (
  text: string, 
  images: ExtractedImage[]
): React.ReactNode => {
  const parts = text.split(/(\{\{img:\d+\}\})/);
  
  return parts.map((part, index) => {
    const match = part.match(/\{\{img:(\d+)\}\}/);
    if (match) {
      const imageIndex = parseInt(match[1]);
      const image = images[imageIndex];
      
      if (image) {
        return (
          <img
            key={index}
            src={`${API_BASE_URL}${image.url}`}
            alt={image.filename}
            className="inline-image"
            style={{ maxWidth: '200px', maxHeight: '150px' }}
          />
        );
      }
    }
    return part;
  });
};

// Usage in quiz display component
const QuizQuestion = ({ question, images }: { question: string; images: ExtractedImage[] }) => {
  return (
    <div className="quiz-question">
      {processImagePlaceholders(question, images)}
    </div>
  );
};
```

### 3. Quiz Submission with Images

**Update Quiz Creation Form:**
```typescript
// Enhanced quiz submission with image support
const submitQuiz = async (quizData: QuizFormData, imageFiles: File[]) => {
  const formData = new FormData();
  
  // Add quiz data as JSON string
  formData.append('quiz', JSON.stringify(quizData));
  
  // Add image files
  imageFiles.forEach(file => {
    formData.append('images', file);
  });
  
  const response = await fetch('/api/v1/quiz/submit-with-images', {
    method: 'POST',
    body: formData,
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Handle successful submission
    console.log('Quiz created:', result.data);
    console.log('Uploaded images:', result.attachments);
  }
};
```

### 4. Image Display Component

**Create reusable image component:**
```typescript
interface QuizImageProps {
  src: string;
  alt: string;
  className?: string;
  maxWidth?: number;
  maxHeight?: number;
}

const QuizImage: React.FC<QuizImageProps> = ({ 
  src, 
  alt, 
  className = "quiz-image",
  maxWidth = 400,
  maxHeight = 300 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const fullSrc = src.startsWith('/') ? `${API_BASE_URL}${src}` : src;
  
  return (
    <div className={`image-container ${className}`}>
      {loading && <div className="image-loading">Loading...</div>}
      {error && <div className="image-error">Failed to load image</div>}
      <img
        src={fullSrc}
        alt={alt}
        style={{ maxWidth, maxHeight }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        style={{ 
          display: loading || error ? 'none' : 'block',
          maxWidth,
          maxHeight,
          objectFit: 'contain'
        }}
      />
    </div>
  );
};
```

### 5. Practice Session Updates

**Handle images in practice sessions:**
```typescript
interface PracticeQuestion {
  id: string;
  type: string;
  question: string;
  options: string[];
  images?: string[]; // URLs to images
}

const PracticeQuestionComponent: React.FC<{ question: PracticeQuestion }> = ({ question }) => {
  // Extract images from the question's images array
  const questionImages = question.images || [];
  
  return (
    <div className="practice-question">
      <div className="question-text">
        {/* Process image placeholders in question text */}
        {processImagePlaceholders(question.question, questionImages)}
      </div>
      
      <div className="question-options">
        {question.options.map((option, index) => (
          <div key={index} className="option">
            {/* Process image placeholders in options */}
            {processImagePlaceholders(option, questionImages)}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🎨 CSS Styling Recommendations

Add these CSS classes for proper image display:

```css
.quiz-image {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 8px 4px;
}

.inline-image {
  vertical-align: middle;
  margin: 0 4px;
  border-radius: 4px;
}

.image-container {
  display: inline-block;
  position: relative;
  margin: 8px;
}

.image-loading,
.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  min-width: 150px;
  background: #f5f5f5;
  border-radius: 4px;
  color: #666;
  font-size: 14px;
}

.image-error {
  background: #ffebee;
  color: #c62828;
}

/* Responsive images */
@media (max-width: 768px) {
  .quiz-image,
  .inline-image {
    max-width: 100%;
    height: auto;
  }
}
```

## 📱 Mobile Considerations

1. **Image Sizing**: Ensure images are responsive and don't break layout on mobile
2. **Loading States**: Show loading indicators for images on slower connections
3. **Error Handling**: Gracefully handle failed image loads
4. **Touch Interactions**: Consider allowing image zoom/tap for better mobile experience

## 🔧 API Endpoints Reference

### New Endpoints:
- `POST /docx/extract-quiz-with-images` - Extract DOCX with full image support
- `POST /quiz/submit-with-images` - Submit quiz with image attachments  
- `GET /attachments/quiz/:year/:month/:filename` - Retrieve quiz images
- `GET /attachments/stats` - Storage statistics

### Authentication:
All endpoints require `Authorization: Bearer <token>` header.

## 🐛 Error Handling

**Handle new error scenarios:**
```typescript
const handleDocxUpload = async (file: File) => {
  try {
    // ... upload logic
  } catch (error) {
    if (error.status === 400) {
      // File validation error
      setError('Invalid file format or size too large');
    } else if (error.status === 413) {
      // File too large
      setError('File size exceeds 10MB limit');
    } else {
      setError('Failed to process DOCX file');
    }
  }
};
```

## ✅ Testing Checklist

- [ ] DOCX upload with images works correctly
- [ ] Image placeholders are replaced with actual images
- [ ] Quiz submission with images functions properly
- [ ] Images display correctly in practice sessions
- [ ] Mobile responsive image display
- [ ] Loading states and error handling work
- [ ] Image URLs are accessible and properly authenticated
- [ ] Backward compatibility with existing quizzes without images

## 📞 Support

If you encounter issues during implementation, please check:

1. **API Response Format**: Ensure you're using the new response structure
2. **Image URLs**: All image URLs should include the full API base path
3. **Authentication**: Image requests require valid JWT tokens
4. **CORS**: Ensure CORS is properly configured for image requests

For technical questions, refer to the backend team or check the Swagger documentation at `/swagger-ui`.