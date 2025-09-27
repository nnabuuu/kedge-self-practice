# Quiz Report Feature Test Plan

## Prerequisites
1. Database is running with migrations applied
2. Backend API server is running
3. Frontend is running
4. User is logged in as a student

## Test Scenarios

### 1. Database Setup
```bash
# Apply the migration
cd backend/packages/dev/database/schema
hasura migrate apply --database-name kedge_db --skip-update-check

# Verify table creation
PGPASSWORD=postgres psql -h localhost -p 7543 -U postgres -d kedge_db -c "\d kedge_practice.quiz_reports"
```

### 2. Backend API Tests

#### Submit a Report
```bash
# Get JWT token (login first)
JWT_TOKEN="your_jwt_token_here"

# Submit a report
curl -X POST http://localhost:8718/v1/quiz/report \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quiz_id": "test-quiz-id",
    "report_type": "wrong_answer",
    "reason": "The correct answer should be B, not C",
    "user_answer": "B"
  }'
```

#### Get My Reports
```bash
curl -X GET "http://localhost:8718/v1/quiz/report/my-reports?status=pending" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### Update My Report
```bash
REPORT_ID="report-id-from-previous-response"

curl -X PUT "http://localhost:8718/v1/quiz/report/$REPORT_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Updated: The answer B is more accurate because..."
  }'
```

### 3. Frontend Tests

#### Student Report Flow
1. **Start Practice Session**
   - Login as a student
   - Select a subject and knowledge points
   - Start practice

2. **Report a Problem**
   - Click "报告问题" button next to a question
   - Select report type (e.g., "答案错误")
   - Add optional description
   - Submit report
   - Verify success message

3. **View My Reports**
   - Click "我的报告" button
   - Verify report list displays
   - Check report status (pending)
   - Expand report details
   - Edit report description (for pending reports)

4. **Filter Reports**
   - Test status filters (All, Pending, Resolved, etc.)
   - Verify filtering works correctly

### 4. Teacher/Admin Management (if implemented)

#### View Reports Dashboard
```bash
# Get reports for management (teacher/admin only)
curl -X GET "http://localhost:8718/v1/quiz/report/management?status=pending&sort=report_count" \
  -H "Authorization: Bearer $TEACHER_JWT_TOKEN"
```

#### Update Report Status
```bash
curl -X PUT "http://localhost:8718/v1/quiz/report/$REPORT_ID/status" \
  -H "Authorization: Bearer $TEACHER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "resolution_note": "Fixed the answer in the quiz database"
  }'
```

## Expected Results

### Success Criteria
- [x] Students can report issues during practice
- [x] Reports are saved to database
- [x] Students can view their own reports
- [x] Students can modify pending reports
- [x] Report status tracking works
- [x] UI components render correctly
- [x] Error handling works properly

### Edge Cases to Test
1. Duplicate report prevention (same user, quiz, type)
2. Rate limiting (if implemented)
3. Authorization (students can't see others' reports)
4. Invalid report types
5. Network errors
6. Long descriptions (max 500 chars)

## Troubleshooting

### Common Issues
1. **Database connection error**
   - Check PostgreSQL is running
   - Verify connection string in .envrc

2. **Authentication error**
   - Ensure JWT token is valid
   - Check user role permissions

3. **Frontend not showing reports**
   - Check browser console for errors
   - Verify API endpoint URLs
   - Check CORS settings

4. **Migration fails**
   - Check if quiz_reports table already exists
   - Verify foreign key constraints (users, quizzes tables exist)