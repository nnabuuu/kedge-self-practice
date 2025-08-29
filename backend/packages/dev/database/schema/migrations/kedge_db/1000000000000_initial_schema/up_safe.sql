-- =================================================================
-- SAFE CONSOLIDATED INITIAL SCHEMA MIGRATION
-- =================================================================
-- This migration creates the complete database schema for the
-- Kedge Self-Practice learning platform, checking for existing objects.
-- Safe to run on databases that may have partial schema.
-- =================================================================

-- =================================================================
-- EXTENSIONS AND SCHEMA SETUP
-- =================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create main schema
CREATE SCHEMA IF NOT EXISTS kedge_practice;

-- =================================================================
-- UTILITY FUNCTIONS
-- =================================================================

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION kedge_practice.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;

-- Alternative naming for the same function
CREATE OR REPLACE FUNCTION kedge_practice.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- CORE TABLES
-- =================================================================

-- Users table with account management
CREATE TABLE IF NOT EXISTS kedge_practice.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  salt VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge points hierarchy for curriculum structure
CREATE TABLE IF NOT EXISTS kedge_practice.knowledge_points (
  id VARCHAR(255) PRIMARY KEY,
  topic VARCHAR(255) NOT NULL,
  volume VARCHAR(255),
  unit VARCHAR(255),
  lesson VARCHAR(255),
  sub VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes table with comprehensive question data
CREATE TABLE IF NOT EXISTS kedge_practice.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('single-choice', 'multiple-choice', 'essay')),
  question TEXT NOT NULL,
  options JSONB,
  answer JSONB NOT NULL,
  original_paragraph TEXT,
  images JSONB,
  tags JSONB DEFAULT '[]',
  knowledge_point_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- PRACTICE SYSTEM TABLES
-- =================================================================

-- Practice sessions for user learning activities
CREATE TABLE IF NOT EXISTS kedge_practice.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  knowledge_point_ids TEXT[],
  quiz_ids UUID[],
  strategy VARCHAR(50) NOT NULL DEFAULT 'random' CHECK (strategy IN ('random', 'sequential', 'adaptive', 'review', 'weakness')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'abandoned')),
  score INTEGER DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  time_limit_minutes INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_id' 
    AND table_schema = 'kedge_practice' 
    AND table_name = 'practice_sessions'
  ) THEN
    ALTER TABLE kedge_practice.practice_sessions
      ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) 
      REFERENCES kedge_practice.users(id) ON DELETE CASCADE;
  END IF;
END $$;

COMMENT ON COLUMN kedge_practice.practice_sessions.user_id IS 'The ID of the user who owns this practice session';

-- Practice answers for tracking user responses
CREATE TABLE IF NOT EXISTS kedge_practice.practice_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  quiz_id UUID NOT NULL,
  user_answer JSONB,
  is_correct BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_session_id' 
    AND table_schema = 'kedge_practice' 
    AND table_name = 'practice_answers'
  ) THEN
    ALTER TABLE kedge_practice.practice_answers
      ADD CONSTRAINT fk_session_id FOREIGN KEY (session_id) 
      REFERENCES kedge_practice.practice_sessions(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_quiz_id' 
    AND table_schema = 'kedge_practice' 
    AND table_name = 'practice_answers'
  ) THEN
    ALTER TABLE kedge_practice.practice_answers
      ADD CONSTRAINT fk_quiz_id FOREIGN KEY (quiz_id) 
      REFERENCES kedge_practice.quizzes(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Practice strategies configuration
CREATE TABLE IF NOT EXISTS kedge_practice.practice_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  strategy_type VARCHAR(50) NOT NULL CHECK (strategy_type IN ('QUICK_PRACTICE', 'WEAKNESS_REINFORCEMENT', 'MISTAKE_REINFORCEMENT', 'COMPREHENSIVE_REVIEW', 'EXAM_SIMULATION')),
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student weaknesses tracking
CREATE TABLE IF NOT EXISTS kedge_practice.student_weaknesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  knowledge_point_id VARCHAR(255) NOT NULL,
  weakness_score DECIMAL(5,2) DEFAULT 0.00 CHECK (weakness_score >= 0 AND weakness_score <= 100),
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  improvement_trend DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_weakness' 
    AND table_schema = 'kedge_practice' 
    AND table_name = 'student_weaknesses'
  ) THEN
    ALTER TABLE kedge_practice.student_weaknesses
      ADD CONSTRAINT fk_user_weakness FOREIGN KEY (user_id) 
      REFERENCES kedge_practice.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_knowledge_point_weakness' 
    AND table_schema = 'kedge_practice' 
    AND table_name = 'student_weaknesses'
  ) THEN
    ALTER TABLE kedge_practice.student_weaknesses
      ADD CONSTRAINT fk_knowledge_point_weakness FOREIGN KEY (knowledge_point_id) 
      REFERENCES kedge_practice.knowledge_points(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_user_knowledge_weakness' 
    AND table_schema = 'kedge_practice' 
    AND table_name = 'student_weaknesses'
  ) THEN
    ALTER TABLE kedge_practice.student_weaknesses
      ADD CONSTRAINT unique_user_knowledge_weakness UNIQUE (user_id, knowledge_point_id);
  END IF;
END $$;

COMMENT ON COLUMN kedge_practice.student_weaknesses.user_id IS 'The ID of the user associated with this weakness record';

-- Student mistakes tracking
CREATE TABLE IF NOT EXISTS kedge_practice.student_mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL,
  practice_session_id UUID,
  mistake_count INTEGER DEFAULT 1,
  last_mistake_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_mastered BOOLEAN DEFAULT false,
  mastered_at TIMESTAMP WITH TIME ZONE,
  review_count INTEGER DEFAULT 0,
  next_review_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_mistake' 
    AND table_schema = 'kedge_practice' 
    AND table_name = 'student_mistakes'
  ) THEN
    ALTER TABLE kedge_practice.student_mistakes
      ADD CONSTRAINT fk_user_mistake FOREIGN KEY (user_id) 
      REFERENCES kedge_practice.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_quiz_mistake' 
    AND table_schema = 'kedge_practice' 
    AND table_name = 'student_mistakes'
  ) THEN
    ALTER TABLE kedge_practice.student_mistakes
      ADD CONSTRAINT fk_quiz_mistake FOREIGN KEY (quiz_id) 
      REFERENCES kedge_practice.quizzes(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_session_mistake' 
    AND table_schema = 'kedge_practice' 
    AND table_name = 'student_mistakes'
  ) THEN
    ALTER TABLE kedge_practice.student_mistakes
      ADD CONSTRAINT fk_session_mistake FOREIGN KEY (practice_session_id) 
      REFERENCES kedge_practice.practice_sessions(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_user_quiz_mistake' 
    AND table_schema = 'kedge_practice' 
    AND table_name = 'student_mistakes'
  ) THEN
    ALTER TABLE kedge_practice.student_mistakes
      ADD CONSTRAINT unique_user_quiz_mistake UNIQUE (user_id, quiz_id);
  END IF;
END $$;

COMMENT ON COLUMN kedge_practice.student_mistakes.user_id IS 'The ID of the user who made this mistake';

-- =================================================================
-- METADATA AND ATTACHMENT TABLES
-- =================================================================

-- Knowledge points metadata for configuration
CREATE TABLE IF NOT EXISTS kedge_practice.knowledge_points_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attachments table for file storage
CREATE TABLE IF NOT EXISTS kedge_practice.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id VARCHAR(255) NOT NULL UNIQUE,
  file_extension VARCHAR(50) NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  file_path VARCHAR(1000) NOT NULL,
  file_size INTEGER NOT NULL,
  file_hash VARCHAR(64),
  original_filename VARCHAR(500),
  uploaded_by UUID,
  upload_purpose VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_uploaded_by' 
    AND table_schema = 'kedge_practice' 
    AND table_name = 'attachments'
  ) THEN
    ALTER TABLE kedge_practice.attachments
      ADD CONSTRAINT fk_uploaded_by FOREIGN KEY (uploaded_by) 
      REFERENCES kedge_practice.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =================================================================
-- INDEXES FOR PERFORMANCE (CREATE IF NOT EXISTS)
-- =================================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_account_id ON kedge_practice.users(account_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON kedge_practice.users(role);
CREATE INDEX IF NOT EXISTS idx_users_preferences_gin ON kedge_practice.users USING GIN (preferences);

-- Knowledge points indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_points_topic ON kedge_practice.knowledge_points(topic);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_hierarchy ON kedge_practice.knowledge_points(topic, volume, unit, lesson);

-- Quizzes indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_type ON kedge_practice.quizzes(type);
CREATE INDEX IF NOT EXISTS idx_quizzes_knowledge_point_id ON kedge_practice.quizzes(knowledge_point_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_tags_gin ON kedge_practice.quizzes USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON kedge_practice.quizzes(created_at DESC);

-- Practice sessions indexes
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON kedge_practice.practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_status ON kedge_practice.practice_sessions(status);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_strategy ON kedge_practice.practice_sessions(strategy);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON kedge_practice.practice_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_status ON kedge_practice.practice_sessions(user_id, status);

-- Practice answers indexes
CREATE INDEX IF NOT EXISTS idx_practice_answers_session_id ON kedge_practice.practice_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_practice_answers_quiz_id ON kedge_practice.practice_answers(quiz_id);
CREATE INDEX IF NOT EXISTS idx_practice_answers_session_quiz ON kedge_practice.practice_answers(session_id, quiz_id);

-- Weakness tracking indexes
CREATE INDEX IF NOT EXISTS idx_student_weaknesses_user_id ON kedge_practice.student_weaknesses(user_id);
CREATE INDEX IF NOT EXISTS idx_student_weaknesses_knowledge_point ON kedge_practice.student_weaknesses(knowledge_point_id);
CREATE INDEX IF NOT EXISTS idx_student_weaknesses_score ON kedge_practice.student_weaknesses(weakness_score DESC);

-- Mistake tracking indexes
CREATE INDEX IF NOT EXISTS idx_student_mistakes_user_id ON kedge_practice.student_mistakes(user_id);
CREATE INDEX IF NOT EXISTS idx_student_mistakes_quiz_id ON kedge_practice.student_mistakes(quiz_id);
CREATE INDEX IF NOT EXISTS idx_student_mistakes_review ON kedge_practice.student_mistakes(next_review_at) WHERE NOT is_mastered;

-- Attachments indexes
CREATE INDEX IF NOT EXISTS idx_attachments_file_id ON kedge_practice.attachments(file_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON kedge_practice.attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachments_mime_type ON kedge_practice.attachments(mime_type);
CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON kedge_practice.attachments(created_at DESC);

-- =================================================================
-- TRIGGERS (CREATE OR REPLACE)
-- =================================================================

-- Auto-update timestamps triggers
DROP TRIGGER IF EXISTS set_users_updated_at ON kedge_practice.users;
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON kedge_practice.users
  FOR EACH ROW EXECUTE FUNCTION kedge_practice.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_knowledge_points_updated_at ON kedge_practice.knowledge_points;
CREATE TRIGGER set_knowledge_points_updated_at BEFORE UPDATE ON kedge_practice.knowledge_points
  FOR EACH ROW EXECUTE FUNCTION kedge_practice.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_quizzes_updated_at ON kedge_practice.quizzes;
CREATE TRIGGER set_quizzes_updated_at BEFORE UPDATE ON kedge_practice.quizzes
  FOR EACH ROW EXECUTE FUNCTION kedge_practice.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_practice_sessions_updated_at ON kedge_practice.practice_sessions;
CREATE TRIGGER set_practice_sessions_updated_at BEFORE UPDATE ON kedge_practice.practice_sessions
  FOR EACH ROW EXECUTE FUNCTION kedge_practice.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_practice_answers_updated_at ON kedge_practice.practice_answers;
CREATE TRIGGER set_practice_answers_updated_at BEFORE UPDATE ON kedge_practice.practice_answers
  FOR EACH ROW EXECUTE FUNCTION kedge_practice.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_practice_strategies_updated_at ON kedge_practice.practice_strategies;
CREATE TRIGGER set_practice_strategies_updated_at BEFORE UPDATE ON kedge_practice.practice_strategies
  FOR EACH ROW EXECUTE FUNCTION kedge_practice.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_student_weaknesses_updated_at ON kedge_practice.student_weaknesses;
CREATE TRIGGER set_student_weaknesses_updated_at BEFORE UPDATE ON kedge_practice.student_weaknesses
  FOR EACH ROW EXECUTE FUNCTION kedge_practice.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_student_mistakes_updated_at ON kedge_practice.student_mistakes;
CREATE TRIGGER set_student_mistakes_updated_at BEFORE UPDATE ON kedge_practice.student_mistakes
  FOR EACH ROW EXECUTE FUNCTION kedge_practice.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_knowledge_points_metadata_updated_at ON kedge_practice.knowledge_points_metadata;
CREATE TRIGGER set_knowledge_points_metadata_updated_at BEFORE UPDATE ON kedge_practice.knowledge_points_metadata
  FOR EACH ROW EXECUTE FUNCTION kedge_practice.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_attachments_updated_at ON kedge_practice.attachments;
CREATE TRIGGER set_attachments_updated_at BEFORE UPDATE ON kedge_practice.attachments
  FOR EACH ROW EXECUTE FUNCTION kedge_practice.set_current_timestamp_updated_at();

-- =================================================================
-- VIEWS
-- =================================================================

-- Practice statistics view for analytics
CREATE OR REPLACE VIEW kedge_practice.practice_statistics_view AS
SELECT
  ps.user_id,
  u.name as user_name,
  ps.id as session_id,
  ps.strategy,
  ps.status,
  ps.score,
  ps.total_questions,
  ps.correct_answers,
  CASE 
    WHEN ps.total_questions > 0 THEN 
      ROUND((ps.correct_answers::numeric / ps.total_questions::numeric) * 100, 2)
    ELSE 0
  END as accuracy_percentage,
  ps.time_limit_minutes,
  ps.started_at,
  ps.completed_at,
  CASE 
    WHEN ps.started_at IS NOT NULL AND ps.completed_at IS NOT NULL THEN
      EXTRACT(EPOCH FROM (ps.completed_at - ps.started_at)) / 60
    ELSE NULL
  END as actual_duration_minutes,
  ps.created_at,
  array_length(ps.knowledge_point_ids, 1) as knowledge_point_count,
  array_length(ps.quiz_ids, 1) as quiz_count
FROM kedge_practice.practice_sessions ps
LEFT JOIN kedge_practice.users u ON ps.user_id = u.id;

-- =================================================================
-- DEFAULT DATA
-- =================================================================

-- Insert default practice strategies
INSERT INTO kedge_practice.practice_strategies (name, description, strategy_type, config, priority) VALUES
  ('Quick Practice', 'Fast-paced practice session for quick review', 'QUICK_PRACTICE', '{"time_limit": 15, "question_count": 10}', 1),
  ('Weakness Reinforcement', 'Focus on areas where you need improvement', 'WEAKNESS_REINFORCEMENT', '{"threshold": 60, "min_attempts": 3}', 2),
  ('Mistake Reinforcement', 'Review and practice previously incorrect answers', 'MISTAKE_REINFORCEMENT', '{"review_interval_days": 3, "max_reviews": 5}', 3)
ON CONFLICT (name) DO NOTHING;

-- Insert anonymous user for guest access
INSERT INTO kedge_practice.users (
  id,
  account_id,
  name,
  password_hash,
  salt,
  role,
  preferences
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'anonymous',
  'Anonymous User',
  '',
  '',
  'student',
  '{
    "theme": "light",
    "language": "zh-CN",
    "notifications": false,
    "autoSave": true,
    "practiceSettings": {
      "defaultQuestionCount": 20,
      "defaultTimeLimit": 30,
      "showAnswerImmediately": true,
      "enableSoundEffects": false
    }
  }'
) ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- COMMENTS AND DOCUMENTATION
-- =================================================================

COMMENT ON SCHEMA kedge_practice IS 'Main schema for the Kedge Self-Practice learning platform';
COMMENT ON TABLE kedge_practice.users IS 'User accounts with authentication and preferences';
COMMENT ON TABLE kedge_practice.knowledge_points IS 'Hierarchical curriculum structure';
COMMENT ON TABLE kedge_practice.quizzes IS 'Quiz questions with various types and metadata';
COMMENT ON TABLE kedge_practice.practice_sessions IS 'User practice sessions with progress tracking';
COMMENT ON TABLE kedge_practice.practice_answers IS 'Individual quiz responses within practice sessions';
COMMENT ON TABLE kedge_practice.practice_strategies IS 'Available learning strategies and configurations';
COMMENT ON TABLE kedge_practice.student_weaknesses IS 'Performance tracking by knowledge point';
COMMENT ON TABLE kedge_practice.student_mistakes IS 'Error tracking and review scheduling';
COMMENT ON TABLE kedge_practice.knowledge_points_metadata IS 'System configuration and metadata storage';
COMMENT ON TABLE kedge_practice.attachments IS 'File attachment metadata with access control';
COMMENT ON VIEW kedge_practice.practice_statistics_view IS 'Aggregated practice session analytics';