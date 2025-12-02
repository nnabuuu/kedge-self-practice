# Design: Fix Wrong-Only Practice Mode

## Problem

The frontend tooltip says "收集最近5次的错题" but the backend `getWrongQuizzesForUser()` method queries **all** practice sessions, not just the last 5. This causes users to see old wrong questions that may no longer be relevant.

## Current Implementation

### Backend: `practice.service.ts` lines 566-621

```typescript
// Current: No session limit - gets ALL wrong answers ever
const query = sql.unsafe`
  SELECT quiz_id FROM (
    SELECT DISTINCT pa.quiz_id
    FROM kedge_practice.practice_answers pa
    JOIN kedge_practice.practice_sessions ps ON pa.session_id = ps.id
    JOIN kedge_practice.quizzes q ON pa.quiz_id = q.id
    WHERE ps.user_id = $userId AND pa.is_correct = false
    -- Missing: session limit!
  ) AS distinct_quizzes
  ORDER BY RANDOM()
  LIMIT $questionCount
`;
```

### Frontend: Already correct

`PracticeMenu.tsx` line 665 already shows tooltip: "收集最近5次的错题"

## Proposed Fix

Modify the backend query to only consider the **last 5 completed practice sessions**:

```typescript
const query = sql.unsafe`
  SELECT quiz_id FROM (
    SELECT DISTINCT pa.quiz_id
    FROM kedge_practice.practice_answers pa
    JOIN kedge_practice.practice_sessions ps ON pa.session_id = ps.id
    JOIN kedge_practice.quizzes q ON pa.quiz_id = q.id
    WHERE ps.user_id = ${userId}::uuid
      AND pa.is_correct = false
      AND ps.id IN (
        SELECT id FROM kedge_practice.practice_sessions
        WHERE user_id = ${userId}::uuid
          AND status = 'completed'
        ORDER BY completed_at DESC
        LIMIT 5
      )
    ${knowledgePointFilter}
    ${quizTypeFilter}
  ) AS distinct_quizzes
  ORDER BY RANDOM()
  LIMIT ${questionCount}
`;
```

## Impact

- **Backend**: One query modification in `getWrongQuizzesForUser()`
- **Frontend**: No changes needed (tooltip already correct)
- **API Contract**: No changes
