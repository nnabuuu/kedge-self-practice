# Practice System API Testing Guide

This guide provides curl commands to test all the Practice System REST APIs.

## Prerequisites

1. **Start the API server**: `npm run dev` or `nx serve api-server`
2. **Get authentication token**: Use the mock admin sign-in endpoint first
3. **Base URL**: `http://localhost:3000` (adjust port if different)

## Authentication Setup

### Get Mock Admin Token
```bash
# Get admin access token (only works from localhost)
curl -X POST http://localhost:3000/auth/mock-admin-sign-in \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "userId": "mock-admin"
# }
```

### Set Token Environment Variable
```bash
# Replace YOUR_TOKEN with the actual token from above
export TOKEN="YOUR_TOKEN_HERE"

# Or for testing, use this one-liner:
export TOKEN=$(curl -s -X POST http://localhost:3000/auth/mock-admin-sign-in | jq -r '.accessToken')
```

## Subjects API (`/api/practice/subjects`)

### List All Subjects
```bash
curl -X GET http://localhost:3000/api/practice/subjects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Get Subject by ID
```bash
curl -X GET http://localhost:3000/api/practice/subjects/history \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Get Subject Statistics
```bash
curl -X GET http://localhost:3000/api/practice/subjects/history/stats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Search Subjects
```bash
curl -X GET "http://localhost:3000/api/practice/subjects/search?q=历史" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Create New Subject (Admin Only)
```bash
curl -X POST http://localhost:3000/api/practice/subjects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "math",
    "name": "数学",
    "icon": "Calculator",
    "color": "#f59e0b",
    "description": "数学基础知识与应用",
    "isActive": true
  }'
```

### Update Subject (Admin Only)
```bash
curl -X PUT http://localhost:3000/api/practice/subjects/math \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "数学基础知识与高级应用"
  }'
```

### Deactivate Subject (Admin Only)
```bash
curl -X PUT http://localhost:3000/api/practice/subjects/math/deactivate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Activate Subject (Admin Only)
```bash
curl -X PUT http://localhost:3000/api/practice/subjects/math/activate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Delete Subject (Admin Only)
```bash
curl -X DELETE http://localhost:3000/api/practice/subjects/math \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## Knowledge Points API (`/api/practice/knowledge-points`)

### List All Knowledge Points
```bash
curl -X GET http://localhost:3000/api/practice/knowledge-points \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### List Knowledge Points by Subject
```bash
curl -X GET "http://localhost:3000/api/practice/knowledge-points?subjectId=history" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Get Knowledge Point Hierarchy
```bash
curl -X GET http://localhost:3000/api/practice/knowledge-points/hierarchy/history \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Get Knowledge Points by Volume
```bash
curl -X GET "http://localhost:3000/api/practice/knowledge-points/by-volume/history/中外历史纲要上" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Get Knowledge Points by Unit
```bash
curl -X GET "http://localhost:3000/api/practice/knowledge-points/by-unit/history/中外历史纲要上/第一单元%20从中华文明起源到秦汉统一多民族封建国家的建立与巩固" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Search Knowledge Points
```bash
curl -X GET "http://localhost:3000/api/practice/knowledge-points/search?q=秦朝&subjectId=history" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Get Knowledge Point by ID
```bash
curl -X GET http://localhost:3000/api/practice/knowledge-points/HIST-1-1-1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Get Multiple Knowledge Points by IDs
```bash
curl -X GET "http://localhost:3000/api/practice/knowledge-points/batch/HIST-1-1-1,HIST-1-1-2,BIO-1-1-1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## Practice Sessions API (`/api/practice/sessions`)

### Create Practice Session
```bash
curl -X POST http://localhost:3000/api/practice/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": "history",
    "knowledgePointIds": ["HIST-1-1-1", "HIST-1-1-2", "HIST-1-2-1-1"],
    "config": {
      "questionType": "new",
      "questionCount": 10,
      "timeLimit": 1800,
      "shuffleQuestions": true,
      "showExplanation": true
    }
  }'
```

### Quick Start Practice Session
```bash
curl -X POST http://localhost:3000/api/practice/sessions/quick-start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": "history",
    "knowledgePointIds": ["HIST-1-1-1", "HIST-1-1-2"],
    "questionCount": 5,
    "questionType": "new"
  }'
```

### Get User's Active Sessions
```bash
curl -X GET http://localhost:3000/api/practice/sessions/active \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Get Practice Session by ID
```bash
# Replace SESSION_ID with actual session ID from create response
curl -X GET http://localhost:3000/api/practice/sessions/SESSION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Submit Answers to Practice Session
```bash
# Replace SESSION_ID with actual session ID
curl -X PUT http://localhost:3000/api/practice/sessions/SESSION_ID/submit-answers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": ["A", "B", null, ["A", "C"], "D"],
    "questionDurations": [45, 60, 0, 90, 30],
    "completed": true
  }'
```

### Update Practice Session
```bash
# Replace SESSION_ID with actual session ID
curl -X PUT http://localhost:3000/api/practice/sessions/SESSION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": ["A", "B", "C"],
    "questionDurations": [45, 60, 55],
    "completed": false
  }'
```

### Get Practice History
```bash
curl -X GET http://localhost:3000/api/practice/sessions/history \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Get Practice History by Subject
```bash
curl -X GET "http://localhost:3000/api/practice/sessions/history?subjectId=history&limit=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Get Knowledge Point Performance
```bash
curl -X GET http://localhost:3000/api/practice/sessions/performance \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Get Knowledge Point Performance by Subject
```bash
curl -X GET "http://localhost:3000/api/practice/sessions/performance?subjectId=history" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Get Session Statistics
```bash
curl -X GET http://localhost:3000/api/practice/sessions/statistics \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Delete Practice Session
```bash
# Replace SESSION_ID with actual session ID
curl -X DELETE http://localhost:3000/api/practice/sessions/SESSION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## Analytics API (`/api/practice/analytics`)

### Get Dashboard Data
```bash
curl -X GET http://localhost:3000/api/practice/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Get Subject Performance Analytics
```bash
curl -X GET http://localhost:3000/api/practice/analytics/subject/history/performance \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Get Subject Performance with Time Range
```bash
curl -X GET "http://localhost:3000/api/practice/analytics/subject/history/performance?timeRange=30d" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Get Progress Tracking Data
```bash
curl -X GET http://localhost:3000/api/practice/analytics/progress-tracking \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Get Progress Tracking with Filters
```bash
curl -X GET "http://localhost:3000/api/practice/analytics/progress-tracking?subjectId=history&timeRange=7d" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Get Learning Insights
```bash
curl -X GET http://localhost:3000/api/practice/analytics/learning-insights \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## Testing Workflow Example

Here's a complete workflow to test the practice system:

```bash
# 1. Get authentication token
export TOKEN=$(curl -s -X POST http://localhost:3000/auth/mock-admin-sign-in | jq -r '.accessToken')

# 2. List available subjects
curl -s -X GET http://localhost:3000/api/practice/subjects \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 3. Get knowledge points for history
curl -s -X GET "http://localhost:3000/api/practice/knowledge-points?subjectId=history" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'

# 4. Create a practice session
SESSION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/practice/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": "history",
    "knowledgePointIds": ["HIST-1-1-1", "HIST-1-1-2"],
    "config": {
      "questionType": "new",
      "questionCount": 5,
      "shuffleQuestions": true,
      "showExplanation": true
    }
  }')

# 5. Extract session ID
SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.data.id')
echo "Created session: $SESSION_ID"

# 6. Get session details
curl -s -X GET "http://localhost:3000/api/practice/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data'

# 7. Submit answers and complete session
curl -s -X PUT "http://localhost:3000/api/practice/sessions/$SESSION_ID/submit-answers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": ["A", "B", "C", "A", "B"],
    "questionDurations": [45, 60, 55, 40, 50],
    "completed": true
  }' | jq '.success'

# 8. Get dashboard analytics
curl -s -X GET http://localhost:3000/api/practice/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq '.data.statistics'
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Notes

- All endpoints require JWT authentication via `Authorization: Bearer <token>`
- Admin-only endpoints require admin role (use mock-admin-sign-in for testing)
- Replace URL-encoded parameters in GET requests (e.g., spaces become `%20`)
- Session IDs are generated dynamically - save them from create responses
- Use `jq` for JSON formatting: `curl ... | jq '.'`
- Time ranges: `7d`, `30d`, `90d`, `1y`
- Question types: `new`, `with-wrong`, `wrong-only`