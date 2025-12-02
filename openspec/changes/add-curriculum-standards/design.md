# Design: Curriculum Standards System

## Context

The current knowledge point system (`knowledge_points` table) uses a rigid 5-column hierarchy (volume, unit, lesson, sub, topic) designed for simple textbook-based content organization. However, official Chinese curriculum standards (课程标准) have a different structure:

- **Metadata fields**: 学段 (grade level), 学科 (subject), 版本 (version), 课程内容 (course content category), 类型 (type: 内容要求/学业要求/教学提示)
- **Variable hierarchy depth**: Curriculum items have 1-3 hierarchy levels (层级1, 层级2, 层级3), with potential for future expansion
- **Future extensions**: Teaching suggestions (教学提示) will be added later, bound to specific grade levels

The system needs to support importing curriculum data from Excel files (e.g., data/物理.xlsx with 273 rows of Physics standards) and allow quizzes to be matched to these official standards for practice alignment.

**Stakeholders**: Teachers (create/import curriculum standards), Students (practice aligned to curriculum), System (maintain data integrity)

**Constraints**:
- Must not break existing `knowledge_points` functionality (backward compatibility)
- PostgreSQL database with Slonik for queries
- NestJS backend with Zod validation
- Monorepo type safety enforced via `nx build`

## Goals / Non-Goals

### Goals
- Support arbitrary hierarchy depths (1-N levels) without schema changes
- Store structured metadata (grade level, subject, version, course content, type)
- Enable efficient querying and filtering by metadata and hierarchy
- Support quiz-to-curriculum-standard relationships
- Provide Excel import for batch curriculum data loading
- Maintain backward compatibility with existing knowledge points system
- Future-proof for teaching suggestions (教学提示) extension

### Non-Goals
- Migrating existing `knowledge_points` data to curriculum standards (separate entities)
- Replacing the legacy knowledge points system (coexistence model)
- Building frontend UI for curriculum standard selection (API-only for now)
- Real-time Excel file editing or two-way sync
- Multi-language support (Chinese only for initial implementation)

## Decisions

### Decision 1: JSONB Storage for Hierarchy Levels
**Choice**: Store hierarchy levels (层级1, 层级2, 层级3, ...) in a single JSONB column `hierarchy_levels` rather than fixed columns.

**Rationale**:
- Flexibility: Supports variable depth without ALTER TABLE for new levels
- Data from 物理.xlsx shows most entries use 2 levels, but structure can vary
- Future curriculum files may have 4+ levels
- PostgreSQL JSONB provides efficient indexing (GIN) and querying
- Aligns with PostgreSQL best practices for semi-structured data

**Alternatives considered**:
1. ❌ Fixed columns (level1, level2, level3 TEXT): Requires schema migration for level4+
2. ❌ Separate `curriculum_hierarchy_levels` table: Over-engineering for simple key-value storage
3. ✅ JSONB with structure `{"level1": "...", "level2": "...", "level3": "..."}`: Chosen for flexibility and query performance

**Example JSONB structure**:
```json
{
  "level1": "物质的形态和变化",
  "level2": null,
  "level3": "能描述固态、液态和气态三种物态的基本特征。"
}
```

### Decision 2: Separate Table for Curriculum Standards
**Choice**: Create new `curriculum_standards` table instead of extending `knowledge_points`.

**Rationale**:
- Different domain entities with different purposes:
  - `knowledge_points`: Informal, textbook-based, teacher-created organization
  - `curriculum_standards`: Official, government-mandated, imported from authoritative sources
- Schema incompatibility (fixed 5 columns vs. flexible hierarchy + metadata)
- Avoids breaking changes to existing code using `knowledge_points`
- Clear separation of concerns for future features (e.g., teaching suggestions)

**Alternatives considered**:
1. ❌ Add type discriminator to `knowledge_points`: Pollutes existing table with incompatible schema
2. ❌ Migrate all data to unified table: Breaking change, requires extensive code updates
3. ✅ Separate table with optional foreign key on quizzes: Clean, non-breaking, clear semantics

### Decision 3: Quiz Relationship via Optional Foreign Key
**Choice**: Add `curriculum_standard_id UUID` column to `quizzes` table with `ON DELETE SET NULL`.

**Rationale**:
- Allows quizzes to optionally reference curriculum standards
- Does not break existing quizzes (nullable column)
- `ON DELETE SET NULL` prevents orphaned quiz records if curriculum standard is deleted
- Simple query pattern: `SELECT * FROM quizzes WHERE curriculum_standard_id = $1`

**Alternatives considered**:
1. ❌ Junction table `quiz_curriculum_standards`: Over-engineering for 1:many relationship
2. ❌ Embed curriculum standard IDs in quiz JSONB: Less efficient querying, no foreign key constraints
3. ✅ Direct foreign key column: Simple, performant, database-enforced referential integrity

### Decision 4: Excel Import via API Endpoint
**Choice**: Implement POST `/v1/curriculum-standards/import` endpoint with file upload, parsing server-side.

**Rationale**:
- Batch import is essential for loading 273+ curriculum items from 物理.xlsx
- Server-side validation ensures data integrity before database insertion
- Reusable for importing other subjects (历史, 生物, etc.)
- Teachers can upload updated curriculum files without manual data entry

**Implementation**:
- Use existing `openpyxl` Python library (already installed) via subprocess or
- Use Node.js `xlsx` library for in-process parsing
- Map Excel columns to schema fields: 序号→sequence_number, 学段→grade_level, etc.
- Detect duplicates by comparing (subject + version + hierarchy_levels) and skip

**Alternatives considered**:
1. ❌ Manual SQL inserts: Not scalable, error-prone
2. ❌ Frontend CSV parsing: Unreliable, duplicates validation logic
3. ✅ Server-side Excel parsing with validation: Authoritative, reusable, auditable

### Decision 5: Indexing Strategy
**Choice**: Create indexes on frequently queried metadata fields and JSONB hierarchy levels.

**Indexes**:
```sql
CREATE INDEX idx_curriculum_standards_subject ON curriculum_standards(subject);
CREATE INDEX idx_curriculum_standards_grade_level ON curriculum_standards(grade_level);
CREATE INDEX idx_curriculum_standards_type ON curriculum_standards(type);
CREATE INDEX idx_curriculum_standards_course_content ON curriculum_standards(course_content);
CREATE INDEX idx_curriculum_standards_hierarchy_gin ON curriculum_standards USING GIN (hierarchy_levels);
```

**Rationale**:
- Students/teachers will filter by subject (物理, 历史) frequently
- Type filtering (内容要求 vs 学业要求) is common
- GIN index enables fast JSONB queries like `hierarchy_levels @> '{"level1": "物质的形态和变化"}'`
- Query pattern from frontend: Filter by subject → filter by course content → select hierarchy item

## Risks / Trade-offs

### Risk: JSONB Query Complexity
**Mitigation**:
- Provide service-layer methods that abstract JSONB queries (e.g., `searchHierarchyLevels(term)`)
- Document JSONB query patterns in repository code comments
- Use parameterized Slonik queries to prevent SQL injection

### Risk: Data Duplication on Import
**Mitigation**:
- Implement duplicate detection logic comparing (subject, version, hierarchy_levels, sequence_number)
- Return import summary indicating skipped duplicates
- Consider unique constraint on (subject, version, sequence_number) if sequence numbers are stable

### Risk: Excel Schema Evolution
**Mitigation**:
- Validate Excel column headers before parsing
- Return clear error messages if required columns are missing
- Version the import format if schema changes (e.g., support both old and new column names)

### Trade-off: Two Knowledge Point Systems
**Trade-off**: Maintaining both `knowledge_points` and `curriculum_standards` increases code complexity.

**Justification**:
- Different use cases: informal teacher organization vs. official standards
- Curriculum standards may not cover all practice scenarios
- Gradual migration path: Teachers can adopt curriculum standards over time
- Future: May deprecate `knowledge_points` once curriculum standards cover all subjects

## Database Migration Script

### Up Migration (up.sql)
```sql
-- Create curriculum_standards table
CREATE TABLE IF NOT EXISTS kedge_practice.curriculum_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_number INTEGER,
    grade_level TEXT NOT NULL,
    subject TEXT NOT NULL,
    version TEXT NOT NULL,
    course_content TEXT NOT NULL,
    type TEXT NOT NULL,
    hierarchy_levels JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for query performance
CREATE INDEX idx_curriculum_standards_subject
    ON kedge_practice.curriculum_standards(subject);

CREATE INDEX idx_curriculum_standards_grade_level
    ON kedge_practice.curriculum_standards(grade_level);

CREATE INDEX idx_curriculum_standards_type
    ON kedge_practice.curriculum_standards(type);

CREATE INDEX idx_curriculum_standards_course_content
    ON kedge_practice.curriculum_standards(course_content);

-- GIN index for JSONB hierarchy queries
CREATE INDEX idx_curriculum_standards_hierarchy_gin
    ON kedge_practice.curriculum_standards USING GIN (hierarchy_levels);

-- Add curriculum_standard_id to quizzes table
ALTER TABLE kedge_practice.quizzes
ADD COLUMN IF NOT EXISTS curriculum_standard_id UUID;

-- Add foreign key constraint with cascade on delete set null
ALTER TABLE kedge_practice.quizzes
ADD CONSTRAINT fk_quizzes_curriculum_standard
    FOREIGN KEY (curriculum_standard_id)
    REFERENCES kedge_practice.curriculum_standards(id)
    ON DELETE SET NULL;

-- Add index for quiz queries by curriculum standard
CREATE INDEX idx_quizzes_curriculum_standard_id
    ON kedge_practice.quizzes(curriculum_standard_id);

-- Add comments for documentation
COMMENT ON TABLE kedge_practice.curriculum_standards IS
    'Official curriculum standards (课程标准) with flexible hierarchy levels and metadata';

COMMENT ON COLUMN kedge_practice.curriculum_standards.sequence_number IS
    '序号 - Sequence number from original curriculum document';

COMMENT ON COLUMN kedge_practice.curriculum_standards.grade_level IS
    '学段 - Grade level (e.g., 义务教育阶段第四学段)';

COMMENT ON COLUMN kedge_practice.curriculum_standards.subject IS
    '学科 - Subject (e.g., 物理, 历史, 生物)';

COMMENT ON COLUMN kedge_practice.curriculum_standards.version IS
    '版本 - Version (e.g., 2022版)';

COMMENT ON COLUMN kedge_practice.curriculum_standards.course_content IS
    '课程内容 - Course content category (e.g., 物质, 能量, 运动和相互作用)';

COMMENT ON COLUMN kedge_practice.curriculum_standards.type IS
    '类型 - Type of requirement (内容要求, 学业要求, 教学提示)';

COMMENT ON COLUMN kedge_practice.curriculum_standards.hierarchy_levels IS
    'JSONB storage for hierarchy levels (层级1, 层级2, 层级3, ...) supporting variable depth';
```

### Down Migration (down.sql)
```sql
-- Remove foreign key from quizzes
ALTER TABLE kedge_practice.quizzes
DROP CONSTRAINT IF EXISTS fk_quizzes_curriculum_standard;

-- Remove column from quizzes
ALTER TABLE kedge_practice.quizzes
DROP COLUMN IF EXISTS curriculum_standard_id;

-- Drop indexes
DROP INDEX IF EXISTS kedge_practice.idx_quizzes_curriculum_standard_id;
DROP INDEX IF EXISTS kedge_practice.idx_curriculum_standards_hierarchy_gin;
DROP INDEX IF EXISTS kedge_practice.idx_curriculum_standards_course_content;
DROP INDEX IF EXISTS kedge_practice.idx_curriculum_standards_type;
DROP INDEX IF EXISTS kedge_practice.idx_curriculum_standards_grade_level;
DROP INDEX IF EXISTS kedge_practice.idx_curriculum_standards_subject;

-- Drop table
DROP TABLE IF EXISTS kedge_practice.curriculum_standards;
```

## Migration Plan

### Phase 1: Schema and API (This Change)
1. Create migration file in `backend/packages/dev/database/schema/migrations/main_db/`
2. Apply migration: `hasura migrate apply`
3. Implement repository, service, controller layers
4. Implement Excel import endpoint
5. Write tests for all CRUD operations
6. Deploy to development environment

### Phase 2: Data Import
1. Import data/物理.xlsx via API endpoint
2. Verify data integrity with sample queries
3. Import additional subjects (历史, 生物) if available
4. Create seed scripts for reproducible imports

### Phase 3: Quiz Alignment (Future)
1. Build UI for teachers to assign curriculum standards to quizzes
2. Implement bulk assignment tools
3. Add curriculum standard filters to student practice flow

### Rollback Plan
- Migration includes down.sql to drop `curriculum_standards` table and remove quiz foreign key
- No data loss for existing `knowledge_points` system
- If import fails, DELETE FROM curriculum_standards WHERE subject = '...' to clean up

## Open Questions

1. **Should curriculum standards support multiple hierarchy levels beyond level3?**
   - Current data shows max 2 levels (level1 + level3, skipping level2)
   - JSONB design supports unlimited levels
   - **Decision**: Support up to level10 in JSONB schema validation, but document that current data uses 1-3

2. **How should teaching suggestions (教学提示) be stored when added?**
   - Same table with type="教学提示" and additional binding to grade level?
   - Separate table with foreign key to curriculum_standards?
   - **Proposed**: Same table with type field, add optional `grade_level_binding` column later

3. **Should there be a many-to-many relationship between quizzes and curriculum standards?**
   - Current design: one quiz → one curriculum standard (1:many)
   - Future scenario: One quiz covers multiple curriculum standards?
   - **Decision**: Start with 1:many (simple), extend to many-to-many if needed (junction table)

4. **What is the uniqueness constraint for curriculum standards?**
   - Is (subject + version + sequence_number) unique?
   - Or (subject + version + hierarchy_levels)?
   - **Action required**: Clarify with stakeholder before adding UNIQUE constraint
