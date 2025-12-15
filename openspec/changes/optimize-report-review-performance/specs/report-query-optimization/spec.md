# Report Query Optimization

## ADDED Requirements

### Requirement: Single Query for Report Management List

The report management endpoint MUST fetch all data in a single database query to avoid N+1 performance issues.

#### Scenario: Report list fetches quiz summaries and report details in one query

**Given** a teacher requests the report management list
**When** the `getReportsForManagement()` method executes
**Then** exactly one database query is made to fetch both quiz summaries and their associated reports
**And** the query uses `json_agg()` or equivalent to nest report details within quiz results
**And** response time is under 500ms for up to 100 quizzes with 10 reports each

#### Scenario: Report list applies filters at database level

**Given** a teacher filters reports by status or report type
**When** the query executes
**Then** filtering is applied in the WHERE clause of the single query
**And** no additional queries are made to filter results

---

### Requirement: Remove Unused Materialized View

The unused `quiz_report_summary` materialized view MUST be removed to eliminate unnecessary refresh overhead.

#### Scenario: Report submission does not trigger view refresh

**Given** a student submits a quiz report
**When** the `submitReport()` method completes
**Then** no materialized view refresh is triggered
**And** the report is persisted within 100ms (excluding network latency)

#### Scenario: Materialized view dropped from database

**Given** the migration is applied
**When** querying for the materialized view
**Then** `kedge_practice.quiz_report_summary` does not exist
**And** the index `idx_report_summary_pending` does not exist

---

### Requirement: Analytics Query Index Coverage

Analytics queries MUST have proper index coverage for time-range filtering and error rate calculations.

#### Scenario: Error rate query uses index for time filtering

**Given** a teacher views error rate analytics with a date range filter
**When** the query filters by `answered_at >= ?` and `answered_at <= ?`
**Then** the query plan shows index scan on `idx_practice_answers_answered_at`
**And** query execution time is under 300ms for tables with 100K+ rows

#### Scenario: Wrong answer distribution uses partial index

**Given** a teacher views wrong answer distribution for quizzes
**When** the query filters by `is_correct = false` and groups by `quiz_id, user_answer`
**Then** the query plan shows index scan on `idx_practice_answers_incorrect`
**And** only incorrect answers are scanned (not entire table)

---

### Requirement: Report Management Query Index Coverage

Report management queries MUST have proper index coverage for status filtering and aggregation.

#### Scenario: Report aggregation uses compound index

**Given** a teacher views the report management list filtered by status
**When** the query filters by `status IN (...)` and groups by `quiz_id`
**Then** the query plan shows index scan on `idx_quiz_reports_status_quiz_created`
**And** sorting by `created_at DESC` uses the index without additional sort step

---

## MODIFIED Requirements

### Requirement: Report Analytics Query Efficiency

The report analytics queries MUST avoid redundant table scans.

#### Scenario: Error rate calculation scans practice_answers once

**Given** a teacher requests quiz error rates
**When** the `getQuizErrorRates()` method executes
**Then** the `practice_answers` table is scanned at most once
**And** both error statistics and wrong answer distributions are calculated in the same scan
