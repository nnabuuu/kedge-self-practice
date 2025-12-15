# Tasks

## Phase 1: Fix N+1 Query Pattern (Highest Impact)

- [ ] **1.1** Refactor `getReportsForManagement()` to use single JOIN query with `json_agg()`
  - Location: `backend/packages/libs/quiz/src/quiz-report.service.ts`
  - Replace Promise.all loop (lines 255-313) with single query
  - Use lateral join or subquery with json_agg for nested reports
  - Maintain existing response structure for API compatibility

- [ ] **1.2** Add unit tests for refactored query
  - Test with various filter combinations (status, report_type)
  - Test pagination (limit, offset)
  - Verify response structure matches current API contract

- [ ] **1.3** Benchmark query performance
  - Test with 50+ quizzes, 10 reports each
  - Measure before/after execution times
  - Verify target: <500ms response time

## Phase 2: Remove Unused Materialized View

- [ ] **2.1** Remove `refreshReportSummary()` calls from service
  - Location: `backend/packages/libs/quiz/src/quiz-report.service.ts`
  - Remove calls in `submitReport()` (line 63-65)
  - Remove calls in `updateReportStatus()` (line 346-348)
  - Remove calls in `bulkUpdateReports()` (line 390-392)
  - Remove the private method `refreshReportSummary()` (lines 500-508)

- [ ] **2.2** Create migration to drop materialized view
  - Drop `kedge_practice.quiz_report_summary` view
  - Drop `idx_report_summary_pending` index
  - Add down migration to recreate if needed for rollback

## Phase 3: Add Missing Database Indexes

- [ ] **3.1** Create migration for `practice_answers` indexes
  - Add `idx_practice_answers_answered_at` on (answered_at DESC)
    - Fixes: Time-range filtering in analytics queries
  - Add `idx_practice_answers_incorrect` partial index on (quiz_id, user_answer) WHERE is_correct = false
    - Fixes: Wrong answer distribution query scans only incorrect answers
  - Use `CREATE INDEX CONCURRENTLY` to avoid table locks in production

- [ ] **3.2** Create migration for `quiz_reports` compound index
  - Add `idx_quiz_reports_status_quiz_created` on (status, quiz_id, created_at DESC)
    - Fixes: Report aggregation query with status filtering
  - Use `CREATE INDEX CONCURRENTLY` to avoid table locks

- [ ] **3.3** Verify index usage in query plans
  - Run EXPLAIN ANALYZE on error rate queries with date filter
  - Run EXPLAIN ANALYZE on wrong answer distribution query
  - Run EXPLAIN ANALYZE on report management query
  - Confirm index scan vs sequential scan for all queries

## Phase 4: Validation

- [ ] **4.1** Run full test suite
  - `nx run-many --target=test --all`
  - Verify no regressions in quiz report functionality

- [ ] **4.2** Build verification
  - `nx run-many --target=build --all`
  - Ensure type checking passes across monorepo

- [ ] **4.3** Manual testing
  - Test report management UI with teacher account
  - Verify all filters work correctly
  - Confirm improved response times
