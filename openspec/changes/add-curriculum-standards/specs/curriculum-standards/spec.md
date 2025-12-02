# Curriculum Standards Specification

## ADDED Requirements

### Requirement: Curriculum Standard Data Model
The system SHALL store curriculum standards (课程标准) with flexible hierarchical levels and structured metadata fields.

#### Scenario: Store physics curriculum standard with 2 hierarchy levels
- **GIVEN** Physics 2022 curriculum data with grade level "义务教育阶段第四学段", subject "物理", version "2022版"
- **WHEN** creating a curriculum standard with course_content "物质", type "内容要求", level1 "物质的形态和变化", level3 "能描述固态、液态和气态三种物态的基本特征。"
- **THEN** the system stores all metadata fields and hierarchy levels in JSONB format
- **AND** assigns a unique UUID identifier

#### Scenario: Store curriculum standard with 1 hierarchy level
- **GIVEN** A curriculum standard with only level1 populated
- **WHEN** creating the standard with empty level2 and level3
- **THEN** the system stores the record with hierarchy_levels containing only level1
- **AND** the record is valid and queryable

#### Scenario: Support future teaching suggestions type
- **GIVEN** Future extension for teaching suggestions (教学提示)
- **WHEN** creating a curriculum standard with type "教学提示"
- **THEN** the system stores it with the same data model
- **AND** supports binding to specific grade levels

### Requirement: Curriculum Standard Creation
The system SHALL provide API endpoints to create curriculum standards with validation.

#### Scenario: Create valid curriculum standard via API
- **GIVEN** Valid curriculum standard data with all required fields
- **WHEN** POST /v1/curriculum-standards with grade_level, subject, version, course_content, type, and hierarchy_levels
- **THEN** return HTTP 201 with created curriculum standard including generated ID
- **AND** store the record in the database

#### Scenario: Reject invalid curriculum standard with missing required fields
- **GIVEN** Curriculum standard data missing required field "subject"
- **WHEN** POST /v1/curriculum-standards
- **THEN** return HTTP 400 with validation error details
- **AND** do not create any database record

#### Scenario: Validate hierarchy levels structure
- **GIVEN** Curriculum standard with hierarchy_levels as non-object value
- **WHEN** POST /v1/curriculum-standards
- **THEN** return HTTP 400 indicating hierarchy_levels must be a valid JSONB object

### Requirement: Curriculum Standard Querying
The system SHALL provide endpoints to query and filter curriculum standards by metadata and hierarchy.

#### Scenario: List all curriculum standards
- **GIVEN** Multiple curriculum standards exist in the database
- **WHEN** GET /v1/curriculum-standards
- **THEN** return HTTP 200 with array of all curriculum standards
- **AND** each standard includes id, metadata fields, and hierarchy_levels

#### Scenario: Filter by subject
- **GIVEN** Curriculum standards for subjects "物理" and "历史"
- **WHEN** GET /v1/curriculum-standards?subject=物理
- **THEN** return only standards where subject equals "物理"

#### Scenario: Filter by grade level and type
- **GIVEN** Mixed curriculum standards with different grade levels and types
- **WHEN** GET /v1/curriculum-standards?grade_level=义务教育阶段第四学段&type=内容要求
- **THEN** return only standards matching both filters

#### Scenario: Retrieve curriculum standard by ID
- **GIVEN** A curriculum standard with known UUID
- **WHEN** GET /v1/curriculum-standards/:id
- **THEN** return HTTP 200 with the complete curriculum standard
- **OR** return HTTP 404 if ID does not exist

### Requirement: Quiz-Curriculum Standard Relationship
The system SHALL support linking quizzes to curriculum standards for practice alignment.

#### Scenario: Associate quiz with curriculum standard
- **GIVEN** An existing quiz and curriculum standard
- **WHEN** updating quiz with curriculum_standard_id field
- **THEN** the quiz stores the curriculum standard reference
- **AND** can be queried by curriculum standard

#### Scenario: Query quizzes by curriculum standard
- **GIVEN** Multiple quizzes associated with curriculum standard ID "abc-123"
- **WHEN** GET /v1/curriculum-standards/abc-123/quizzes
- **THEN** return all quizzes linked to that curriculum standard
- **AND** include quiz details and knowledge point references if present

#### Scenario: Quiz without curriculum standard remains valid
- **GIVEN** A quiz with no curriculum_standard_id (legacy or unaligned)
- **WHEN** querying or practicing the quiz
- **THEN** the quiz functions normally without curriculum standard metadata

### Requirement: Hierarchical Search
The system SHALL support searching within hierarchy levels for curriculum standard discovery.

#### Scenario: Search by level1 hierarchy
- **GIVEN** Curriculum standards with various level1 values like "物质的形态和变化", "物质的属性"
- **WHEN** GET /v1/curriculum-standards?level1=物质的形态和变化
- **THEN** return all standards where hierarchy_levels.level1 matches

#### Scenario: Search across multiple hierarchy levels
- **GIVEN** Curriculum standards with populated level1, level2, level3
- **WHEN** GET /v1/curriculum-standards?search=密度
- **THEN** return standards where any hierarchy level contains "密度"

### Requirement: Curriculum Data Import
The system SHALL provide functionality to import curriculum standards from Excel files.

#### Scenario: Import physics curriculum from Excel
- **GIVEN** Excel file data/物理.xlsx with columns: 序号, 学段, 学科, 版本, 课程内容, 类型, 层级1, 层级2, 层级3
- **WHEN** POST /v1/curriculum-standards/import with file upload
- **THEN** parse Excel rows and create curriculum standards for each row
- **AND** return import summary with success count and any errors

#### Scenario: Handle malformed Excel data
- **GIVEN** Excel file with missing required columns
- **WHEN** POST /v1/curriculum-standards/import
- **THEN** return HTTP 400 with error indicating missing columns
- **AND** do not create any partial records

#### Scenario: Skip duplicate curriculum standards
- **GIVEN** Excel file with rows already existing in database (same metadata + hierarchy)
- **WHEN** importing the file
- **THEN** skip duplicate rows and report them in import summary
- **AND** only create new unique curriculum standards

### Requirement: Data Integrity
The system SHALL maintain referential integrity and prevent orphaned relationships.

#### Scenario: Delete curriculum standard with no quiz references
- **GIVEN** A curriculum standard with no quizzes referencing it
- **WHEN** DELETE /v1/curriculum-standards/:id
- **THEN** return HTTP 204 and remove the curriculum standard

#### Scenario: Prevent deletion of curriculum standard with quiz references
- **GIVEN** A curriculum standard referenced by one or more quizzes
- **WHEN** DELETE /v1/curriculum-standards/:id
- **THEN** return HTTP 409 conflict error
- **AND** do not delete the curriculum standard
- **OR** cascade update quiz references to NULL if configured

### Requirement: Backward Compatibility
The system SHALL maintain existing knowledge_points functionality without breaking changes.

#### Scenario: Existing knowledge points continue to function
- **GIVEN** Quizzes and practice sessions using legacy knowledge_points table
- **WHEN** querying or practicing with knowledge point filters
- **THEN** all existing functionality works unchanged

#### Scenario: Quizzes can reference both knowledge points and curriculum standards
- **GIVEN** A quiz with both knowledge_point_id and curriculum_standard_id
- **WHEN** querying the quiz
- **THEN** both relationships are preserved and returned
- **AND** frontend can choose which to display based on context
