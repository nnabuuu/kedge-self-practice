# Fix Teacher Report Review Performance Bottlenecks

## Summary

Teachers experience 5-10 second delays when reviewing student-submitted reports. Investigation reveals three backend issues causing the slowdown:

1. **N+1 Query Pattern** in `QuizReportService.getReportsForManagement()` - fetches quiz summaries then loops through each quiz making individual queries
2. **Unused Materialized View** - `quiz_report_summary` is refreshed on every report submission but never queried, causing unnecessary lock contention
3. **Double Table Scan** in analytics queries - `practice_answers` is scanned twice in error rate calculations

## Motivation

Report review is a core teacher workflow. Slow response times directly impact teacher productivity and satisfaction. The current 5-10 second load times are unacceptable for a simple list view.

## Scope

### In Scope
- Fix N+1 query pattern by consolidating into single JOIN query
- Remove unused materialized view and its refresh logic
- Add missing database indexes for analytics queries
- Optimize analytics queries to single-pass calculation

### Out of Scope
- Redis caching layer (deferred to phase 2 pending measurement of query fixes)
- Frontend optimizations (deferred pending backend fix impact measurement)
- CSV export streaming (deferred - acceptable to add row limit warning for now)

## Technical Approach

### 1. Replace N+1 Query with Single JOIN Query

**Location:** `backend/packages/libs/quiz/src/quiz-report.service.ts` lines 255-313

**Current Behavior:**
```typescript
// Gets summary for ALL quizzes first
const summaryResult = await this.persistentService.pgPool.query(...);

// THEN for EACH quiz, makes a separate query
const quizzesWithReports = await Promise.all(
  summaryResult.rows.map(async (summary) => {
    const reportsResult = await this.persistentService.pgPool.query(...);
    // ...
  })
);
```

**Proposed Change:** Single query using `json_agg()` to nest reports within quiz results, eliminating N+1 round-trips.

### 2. Remove Unused Materialized View

**Location:** `backend/packages/libs/quiz/src/quiz-report.service.ts` lines 62-65, 345-348, 390-393

The materialized view `kedge_practice.quiz_report_summary` is:
- Created in migration 2000000000024
- Refreshed asynchronously on every report submission
- Never actually queried in the service code

**Proposed Change:**
- Remove `refreshReportSummary()` calls from the service
- Create migration to drop the materialized view

### 3. Add Missing Indexes for Analytics Queries

**Current Indexes on `practice_answers`:**
- `idx_practice_answers_quiz_created` - (quiz_id, created_at)
- `idx_practice_answers_quiz_correct_created` - (quiz_id, is_correct, created_at)
- `idx_practice_answers_session` - (session_id)

**Missing Indexes:**

1. **`answered_at` index** - Analytics queries filter by `answered_at` (not `created_at`):
   ```sql
   WHERE pa.answered_at >= ? AND pa.answered_at <= ?
   ```
   Currently causes full table scan.

2. **Partial index for wrong answers** - Wrong answer distribution query:
   ```sql
   WHERE pa.is_correct = false
   GROUP BY pa.quiz_id, pa.user_answer
   ```
   Scans entire table instead of just incorrect answers.

3. **`quiz_reports` compound index** - Report aggregation query:
   ```sql
   WHERE r.status IN (...)
   GROUP BY r.quiz_id
   ORDER BY MAX(r.created_at) DESC
   ```
   Missing optimal index for status + quiz + created_at ordering.

**Proposed Changes:**
```sql
-- Time-range filtering in analytics
CREATE INDEX idx_practice_answers_answered_at
  ON kedge_practice.practice_answers(answered_at DESC);

-- Wrong answer distribution (partial index)
CREATE INDEX idx_practice_answers_incorrect
  ON kedge_practice.practice_answers(quiz_id, user_answer)
  WHERE is_correct = false;

-- Report aggregation with status filtering
CREATE INDEX idx_quiz_reports_status_quiz_created
  ON kedge_practice.quiz_reports(status, quiz_id, created_at DESC);
```

## Expected Impact

| Metric | Before | After |
|--------|--------|-------|
| Report list load time | 5-10s | <500ms |
| Analytics query time | 2-3s | <300ms |
| Lock contention on report submit | Yes | No |

## References

- Panel Discussion Critique 1: Promise.all() appears parallel but is bottlenecked by connection pool - true parallelism requires single query
- Panel Discussion Critique 2: Frontend optimizations deferred to phase 2 - measure backend impact first before adding client-side complexity
- Panel Discussion Critique 3: Redis caching is phase 2 - fix queries first, only add caching if aggregated analytics still slow
