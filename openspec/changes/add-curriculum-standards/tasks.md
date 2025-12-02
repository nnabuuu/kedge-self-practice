# Implementation Tasks

## 1. Database Schema
- [ ] 1.1 Create migration file for `curriculum_standards` table
- [ ] 1.2 Add columns: id (UUID), sequence_number (integer), grade_level (text), subject (text), version (text), course_content (text), type (text), hierarchy_levels (JSONB)
- [ ] 1.3 Add indexes on subject, grade_level, type, and course_content for query performance
- [ ] 1.4 Add GIN index on hierarchy_levels JSONB column for hierarchical queries
- [ ] 1.5 Add migration to extend quizzes table with optional curriculum_standard_id (UUID) foreign key
- [ ] 1.6 Add foreign key constraint with ON DELETE SET NULL for quiz relationship
- [ ] 1.7 Apply migration to local database and verify schema

## 2. Models and Schemas
- [ ] 2.1 Create `backend/packages/libs/models/src/practice/curriculum-standard.schema.ts`
- [ ] 2.2 Define `CurriculumStandardSchema` with Zod including all metadata fields
- [ ] 2.3 Define `HierarchyLevelsSchema` as flexible JSONB object (level1, level2, level3, ...)
- [ ] 2.4 Define `CurriculumStandardCreateSchema` for API input validation
- [ ] 2.5 Define `CurriculumStandardFilterSchema` for query parameters
- [ ] 2.6 Export types and schemas from models package index
- [ ] 2.7 Update quiz schema to include optional `curriculum_standard_id` field

## 3. Repository Layer
- [ ] 3.1 Create `backend/packages/libs/knowledge-point/src/lib/curriculum-standard.repository.ts`
- [ ] 3.2 Implement `createCurriculumStandard(data)` method using Slonik
- [ ] 3.3 Implement `findCurriculumStandardById(id)` method
- [ ] 3.4 Implement `listCurriculumStandards(filters)` with support for subject, grade_level, type, course_content filters
- [ ] 3.5 Implement `searchHierarchyLevels(searchTerm)` using JSONB queries
- [ ] 3.6 Implement `findQuizzesByCurriculumStandardId(id)` method
- [ ] 3.7 Implement `deleteCurriculumStandard(id)` with referential integrity check
- [ ] 3.8 Add error handling and logging for all repository methods

## 4. Service Layer
- [ ] 4.1 Create `backend/packages/libs/knowledge-point/src/lib/curriculum-standard.service.ts`
- [ ] 4.2 Implement business logic for curriculum standard creation with validation
- [ ] 4.3 Implement query and filtering logic delegating to repository
- [ ] 4.4 Implement hierarchical search logic
- [ ] 4.5 Implement quiz relationship management
- [ ] 4.6 Add service method for Excel import (parse and batch create)
- [ ] 4.7 Implement duplicate detection logic for imports
- [ ] 4.8 Add comprehensive error handling for service operations

## 5. Controller Layer
- [ ] 5.1 Create or extend controller at `backend/packages/apps/api-server/src/app/controllers/curriculum-standard.controller.ts`
- [ ] 5.2 Implement POST /v1/curriculum-standards endpoint with Zod validation
- [ ] 5.3 Implement GET /v1/curriculum-standards with query parameter support
- [ ] 5.4 Implement GET /v1/curriculum-standards/:id endpoint
- [ ] 5.5 Implement GET /v1/curriculum-standards/:id/quizzes endpoint
- [ ] 5.6 Implement DELETE /v1/curriculum-standards/:id endpoint
- [ ] 5.7 Implement POST /v1/curriculum-standards/import for Excel file uploads
- [ ] 5.8 Add Swagger/OpenAPI documentation for all endpoints
- [ ] 5.9 Add authentication guards (TeacherGuard for write operations)

## 6. Excel Import Utility
- [ ] 6.1 Create `backend/packages/libs/knowledge-point/src/lib/utils/excel-import.utility.ts`
- [ ] 6.2 Implement Excel file parsing using openpyxl via Python subprocess or xlsx library
- [ ] 6.3 Map Excel columns (序号, 学段, 学科, 版本, 课程内容, 类型, 层级1, 层级2, 层级3) to schema fields
- [ ] 6.4 Handle empty/null hierarchy levels correctly
- [ ] 6.5 Implement validation for required columns
- [ ] 6.6 Return import summary with success/error counts and details

## 7. Module Registration
- [ ] 7.1 Update `backend/packages/libs/knowledge-point/src/lib/knowledge-point.module.ts` to include new services and repositories
- [ ] 7.2 Export new controller from api-server module
- [ ] 7.3 Ensure dependency injection is properly configured

## 8. Testing
- [ ] 8.1 Write unit tests for CurriculumStandardRepository
- [ ] 8.2 Write unit tests for CurriculumStandardService
- [ ] 8.3 Write integration tests for controller endpoints
- [ ] 8.4 Test Excel import with sample data/物理.xlsx file
- [ ] 8.5 Test query filtering and hierarchical search
- [ ] 8.6 Test quiz relationship creation and querying
- [ ] 8.7 Test referential integrity and deletion scenarios
- [ ] 8.8 Test backward compatibility with existing knowledge_points

## 9. Data Migration and Seeding
- [ ] 9.1 Create seed script to import data/物理.xlsx as initial data (optional)
- [ ] 9.2 Verify imported data integrity and query performance
- [ ] 9.3 Document seeding process for other subjects

## 10. Documentation
- [ ] 10.1 Update API documentation with new endpoints
- [ ] 10.2 Add JSDoc comments to all new services and repositories
- [ ] 10.3 Update CLAUDE.md with curriculum standards architecture details
- [ ] 10.4 Document Excel import format and requirements

## 11. Build and Validation
- [ ] 11.1 Run `nx run-many --target=build --all` to ensure type safety across monorepo
- [ ] 11.2 Run all tests with `nx run-many --target=test --all`
- [ ] 11.3 Fix any type errors or test failures
- [ ] 11.4 Run linter and fix any issues
- [ ] 11.5 Format code with Prettier
