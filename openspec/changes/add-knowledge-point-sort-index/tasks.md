## 1. Database Schema

- [x] 1.1 Create migration `2000000000033_add_sort_index_to_knowledge_points`
- [x] 1.2 Add `sort_index INTEGER DEFAULT 0` column to `knowledge_points` table
- [x] 1.3 Add composite index on `(topic, volume, sort_index)` for query performance
- [x] 1.4 Populate existing records with sort_index based on current ID order (one-time data migration)

## 2. Backend Model Updates

- [x] 2.1 Add `sort_index` field to `KnowledgePointSchema` in `knowledge-point.schema.ts`
- [x] 2.2 Update `KnowledgePointRepository.listKnowledgePoints()` to order by `sort_index ASC, id ASC`
- [x] 2.3 Update `KnowledgePointRepository.createKnowledgePoint()` to accept and store `sort_index`
- [x] 2.4 Update `KnowledgePointStorage` to include `sort_index` and preserve backend ordering
- [x] 2.5 Run `nx run-many --target=build --all` to verify type consistency

## 3. Excel Import Updates

- [x] 3.1 Update `bootstrap-remote-knowledge-points.js` script to auto-generate `sort_index` from row order

## 4. Frontend Updates

- [x] 4.1 Remove `.sort()` calls on volumes, units, lessons in `QuizBankManagement.tsx`
- [x] 4.2 Update `getLocalHierarchyOptions()` to preserve backend ordering
- [x] 4.3 Update `QuizErrorRateAnalytics.tsx` to preserve backend ordering

## 5. Verification

- [x] 5.1 Test with sample data containing "第一单元", "第二单元", "第十单元", "第二十单元"
- [x] 5.2 Verify ordering is correct after import
- [x] 5.3 Verify existing data continues to display in reasonable order (by ID)

## Notes

The original sort_index approach was modified. Instead of using `sort_index` for ordering at all levels, we now use `CAST(SUBSTRING(id FROM 4) AS INTEGER)` to extract the numeric portion of IDs (format: `kp_N`) and sort by that. This correctly reflects the original Excel import order which corresponds to the proper Chinese ordinal ordering.
