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
