# Quiz Image Processing Design

## Overview
The quiz module supports optional images for questions and answers. Images are stored on disk with a configurable path so deployments can choose local folders or mounted volumes.

## Storage Path
- Environment variable: `QUIZ_STORAGE_PATH`
- Default: `./quiz-storage`
- Backend writes image files beneath this directory.

## Workflow
1. Frontend submits a quiz via `multipart/form-data`, including image files and quiz JSON.
2. Within the quiz JSON, the question text or any option can contain image placeholders such as `{{img:0}}`, `{{img:1}}`, etc. The number after the colon corresponds to the order of the uploaded files. Using the `type:index` pattern leaves room for other media types like `{{audio:0}}` in the future.
3. `QuizStorageService` saves each uploaded file and returns its absolute path.
4. Returned paths are stored in the `images` column of `kedge_practice.quizzes`.
5. API responses include both the placeholders in the text and an `images` array so the frontend can substitute the correct URLs when rendering.

### Example request

```http
POST /api/practice/quizzes HTTP/1.1
Content-Type: multipart/form-data

payload: {"question":"Who built the Great Wall? {{img:0}}","options":["{{img:1}} Qin Shi Huang","Han Wu Di"],"answer":"Qin Shi Huang"}
images: question.jpg
images: option-a.jpg
```

Equivalent cURL command:

```bash
curl -X POST http://localhost:3000/api/practice/quizzes \
  -F 'payload={"question":"Who built the Great Wall? {{img:0}}","options":["{{img:1}} Qin Shi Huang","Han Wu Di"],"answer":"Qin Shi Huang"};type=application/json' \
  -F 'images=@question.jpg' \
  -F 'images=@option-a.jpg'
```

### Example response

```json
{
  "id": 1,
  "question": "Who built the Great Wall? {{img:0}}",
  "options": ["{{img:1}} Qin Shi Huang", "Han Wu Di"],
  "answer": "Qin Shi Huang",
  "images": ["/quiz-storage/question.jpg", "/quiz-storage/option-a.jpg"]
}
```

To retrieve the quiz later:

```http
GET /api/practice/quizzes/1 HTTP/1.1
```

## Database Schema
The `quizzes` table contains an `images` JSON column storing an array of file paths for associated images.

## Frontend Coordination
- When creating or updating a quiz, attach images as form-data fields named `images`.
- Use placeholders `{{img:0}}`, `{{img:1}}`, ... in the question or options to mark where each image should appear. Indexes correspond to the uploaded files.
- After the API responds, replace these placeholders with the returned paths (e.g., `{{img:0}}` becomes `https://api.example.com/static/question.jpg`). You can also wrap the URL in Markdown like `![desc](URL)` to render inline images.
- Ensure files are uploaded in the order expected by the quiz options if positions matter.

## Future Considerations
- Serve images through a CDN or static hosting service for better performance.
- Add validation for file type and size to avoid unsupported or large uploads.
- Implement deletion or replacement of obsolete images.
