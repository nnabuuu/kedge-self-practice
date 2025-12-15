## Why

Chinese curriculum units like "第一单元", "第二单元", "第三单元" do not sort correctly when using string comparison. The current system uses lexicographic ordering which produces incorrect results for Chinese ordinal numbers, causing confusing display order for teachers and students selecting knowledge points.

## What Changes

- Add `sort_index` integer column to `knowledge_points` table for explicit ordering control
- Add composite index on `(topic, volume, sort_index)` for query performance
- Update backend repository to order queries by `sort_index ASC, id ASC`
- Update frontend to respect backend ordering instead of client-side `.sort()` on strings
- Update Excel import to auto-populate `sort_index` from row order

## Impact

- Affected specs: knowledge-point-ordering (new capability)
- Affected code:
  - `backend/packages/dev/database/schema/migrations/` - new migration
  - `backend/packages/libs/models/src/practice/knowledge-point.schema.ts` - add sortIndex field
  - `backend/packages/libs/knowledge-point/src/lib/knowledge-point.repository.ts` - update queries
  - `frontend-practice/src/pages/teacher/QuizBankManagement.tsx` - remove client-side sorting
