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
