# Add Curriculum Standards (课程标准)

## Why

The current knowledge point system uses a fixed 5-level hierarchy (volume, unit, lesson, sub, topic) that doesn't accommodate official Chinese curriculum standards (课程标准). Real-world curriculum data (e.g., Physics 2022 curriculum standards from data/物理.xlsx) requires flexible hierarchical structures with varying depth and structured metadata including grade level (学段), subject (学科), version (版本), course content category (课程内容), and type (类型: 内容要求/学业要求). This proposal adds support for curriculum standards with arbitrary hierarchy levels and extensible metadata to align with official educational standards, with future support for teaching suggestions (教学提示).

## What Changes

- **NEW**: Introduce `curriculum_standards` table supporting arbitrary hierarchy levels (层级1, 层级2, 层级3, ...) with structured metadata
- **NEW**: Add metadata fields: `grade_level` (学段), `subject` (学科), `version` (版本), `course_content` (课程内容), `type` (类型), `sequence_number` (序号)
- **NEW**: Support JSONB storage for hierarchy levels to accommodate variable depth (1-N levels) without schema changes
- **NEW**: Add API endpoints for creating, querying, and matching quizzes to curriculum standards
- **NEW**: Implement hierarchical search and filtering by metadata and hierarchy levels
- **NEW**: Add quiz relationship via optional `curriculum_standard_id` foreign key on quizzes table
- **NEW**: Add import functionality to load curriculum data from Excel files
- **NON-BREAKING**: Existing `knowledge_points` table remains unchanged for backward compatibility
- **FUTURE**: Architecture supports future extension for teaching suggestions (教学提示) bound to specific grade levels (学段)

## Impact

### Affected Specs
- **NEW capability**: `curriculum-standards` - Complete new specification for official curriculum standard management

### Affected Code
- `backend/packages/dev/database/schema/migrations/` - New migration for `curriculum_standards` table and quiz relationship
- `backend/packages/libs/models/src/practice/` - New Zod schemas: `CurriculumStandardSchema`, `CurriculumStandardCreateSchema`
- `backend/packages/libs/knowledge-point/src/lib/` - New `CurriculumStandardService`, `CurriculumStandardRepository`
- `backend/packages/apps/api-server/src/app/controllers/` - New or extended controller with curriculum standard endpoints
- Frontend applications (future) - Will support curriculum standard selection UI

### Dependencies
- Database migration required
- Excel parsing library for import (openpyxl already installed)
- No breaking changes to existing APIs

### Migration Notes
- Existing `knowledge_points` table continues serving legacy use cases
- Curriculum standards are independent entities with their own lifecycle
- Quizzes can reference curriculum standards without affecting existing knowledge point relationships
