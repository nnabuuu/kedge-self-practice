# Tasks: Fix Wrong-Only Practice Mode

## Implementation Tasks

### 1. Update getWrongQuizzesForUser query
- [x] Modify the SQL query to add subquery limiting to last 5 completed sessions
- [x] Use `ORDER BY completed_at DESC LIMIT 5` to get recent sessions
- [x] Preserve existing knowledge point and quiz type filters
- **File**: `backend/packages/libs/practice/src/lib/practice.service.ts`
- **Method**: `getWrongQuizzesForUser()` (lines 566-621)

### 2. Update getRecentWrongQuestions method
- [x] Verify this method also respects the 5-session limit
- [x] Already uses `sessionLimit = 5` parameter (correct at line 756)
- **File**: `backend/packages/libs/practice/src/lib/practice.service.ts`
- **Method**: `getRecentWrongQuestions()` (lines 756-780)

### 3. Verification
- [x] Run `nx build practice` to verify no type errors
- [ ] Test wrong-only practice mode with user who has >5 sessions

## Validation Checklist

- [x] Wrong-only mode only considers last 5 completed sessions
- [x] Old wrong answers (from sessions 6+) are excluded
- [x] Quizzes are properly deduplicated
- [x] Knowledge point filter still works
- [x] Quiz type filter still works
- [x] Frontend tooltip already says "收集最近5次的错题" (no change needed)
