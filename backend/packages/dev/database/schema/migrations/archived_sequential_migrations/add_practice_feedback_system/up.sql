-- =================================================================
-- PRACTICE FEEDBACK AND ANALYSIS SYSTEM
-- =================================================================
-- This migration adds comprehensive feedback and analysis features
-- for practice session completion, including performance metrics,
-- personalized recommendations, and learning insights.
-- =================================================================

-- =================================================================
-- FEEDBACK ANALYSIS TABLES
-- =================================================================

-- Session analysis results generated after completion
CREATE TABLE IF NOT EXISTS kedge_practice.session_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  
  -- Performance Metrics
  accuracy_percentage DECIMAL(5,2) NOT NULL CHECK (accuracy_percentage >= 0 AND accuracy_percentage <= 100),
  speed_percentile DECIMAL(5,2) CHECK (speed_percentile >= 0 AND speed_percentile <= 100),
  consistency_score DECIMAL(5,2) CHECK (consistency_score >= 0 AND consistency_score <= 100),
  improvement_rate DECIMAL(5,2), -- Compared to previous sessions
  
  -- Time Analysis
  total_time_seconds INTEGER NOT NULL,
  average_time_per_question DECIMAL(10,2),
  fastest_answer_seconds INTEGER,
  slowest_answer_seconds INTEGER,
  
  -- Question Type Performance
  single_choice_accuracy DECIMAL(5,2),
  multiple_choice_accuracy DECIMAL(5,2),
  essay_completion_rate DECIMAL(5,2),
  
  -- Comparative Metrics
  peer_comparison_percentile DECIMAL(5,2), -- How user compares to peers
  personal_best_comparison DECIMAL(5,2), -- Compared to personal best
  
  -- Strengths and Weaknesses
  identified_strengths JSONB DEFAULT '[]', -- Array of strong knowledge points
  identified_weaknesses JSONB DEFAULT '[]', -- Array of weak knowledge points
  
  -- Difficulty Analysis (even though difficulty field is removed, we calculate it)
  perceived_difficulty VARCHAR(50) CHECK (perceived_difficulty IN ('easy', 'moderate', 'challenging', 'very_challenging')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_session_analysis FOREIGN KEY (session_id) REFERENCES kedge_practice.practice_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_analysis FOREIGN KEY (user_id) REFERENCES kedge_practice.users(id) ON DELETE CASCADE
);

-- Detailed feedback for each answered question
CREATE TABLE IF NOT EXISTS kedge_practice.answer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL UNIQUE,
  session_id UUID NOT NULL,
  quiz_id UUID NOT NULL,
  
  -- Correctness Details
  is_correct BOOLEAN NOT NULL,
  partial_credit DECIMAL(3,2) DEFAULT 0.00 CHECK (partial_credit >= 0 AND partial_credit <= 1),
  
  -- Answer Analysis
  answer_quality VARCHAR(50) CHECK (answer_quality IN ('excellent', 'good', 'satisfactory', 'needs_improvement', 'poor')),
  common_mistake_type VARCHAR(100), -- e.g., 'calculation_error', 'concept_confusion', 'careless_mistake'
  
  -- Time Analysis
  time_spent_seconds INTEGER,
  time_category VARCHAR(50) CHECK (time_category IN ('too_fast', 'optimal', 'slow', 'timeout')),
  
  -- Detailed Feedback
  explanation TEXT, -- Why the answer is correct/incorrect
  hint TEXT, -- Hint for next time
  related_concept TEXT, -- Key concept to review
  
  -- Learning Material References
  recommended_resources JSONB DEFAULT '[]', -- Array of resource links/IDs
  similar_quiz_ids UUID[], -- Similar questions for practice
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_answer_feedback FOREIGN KEY (answer_id) REFERENCES kedge_practice.practice_answers(id) ON DELETE CASCADE,
  CONSTRAINT fk_session_feedback FOREIGN KEY (session_id) REFERENCES kedge_practice.practice_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_quiz_feedback FOREIGN KEY (quiz_id) REFERENCES kedge_practice.quizzes(id) ON DELETE CASCADE
);

-- Learning recommendations generated from analysis
CREATE TABLE IF NOT EXISTS kedge_practice.learning_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Recommendation Type
  recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN (
    'review_material', 'practice_more', 'advance_topic', 'take_break', 'change_strategy'
  )),
  
  -- Priority and Urgency
  priority INTEGER NOT NULL DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
  urgency VARCHAR(50) DEFAULT 'normal' CHECK (urgency IN ('immediate', 'high', 'normal', 'low')),
  
  -- Recommendation Details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  reason TEXT, -- Why this recommendation
  expected_benefit TEXT, -- What improvement to expect
  
  -- Action Items
  action_items JSONB DEFAULT '[]', -- Array of specific actions
  target_knowledge_points TEXT[], -- Knowledge points to focus on
  suggested_quiz_ids UUID[], -- Specific quizzes to practice
  
  -- Tracking
  is_acknowledged BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Validity
  expires_at TIMESTAMP WITH TIME ZONE, -- When recommendation becomes stale
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_session_recommendation FOREIGN KEY (session_id) REFERENCES kedge_practice.practice_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_recommendation FOREIGN KEY (user_id) REFERENCES kedge_practice.users(id) ON DELETE CASCADE
);

-- Achievement and milestone tracking
CREATE TABLE IF NOT EXISTS kedge_practice.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID, -- Session that triggered the achievement
  
  -- Achievement Details
  achievement_type VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  achievement_description TEXT,
  
  -- Badge/Icon Information
  badge_icon VARCHAR(255), -- Icon identifier or URL
  badge_color VARCHAR(50), -- Color theme
  rarity VARCHAR(50) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  
  -- Progress Tracking
  progress_current INTEGER DEFAULT 0,
  progress_target INTEGER,
  is_unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  
  -- Rewards
  reward_points INTEGER DEFAULT 0,
  reward_description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_user_achievement FOREIGN KEY (user_id) REFERENCES kedge_practice.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_session_achievement FOREIGN KEY (session_id) REFERENCES kedge_practice.practice_sessions(id) ON DELETE SET NULL,
  CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_type)
);

-- Performance trends over time
CREATE TABLE IF NOT EXISTS kedge_practice.performance_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  knowledge_point_id VARCHAR(255),
  
  -- Time Period
  period_type VARCHAR(50) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_date DATE NOT NULL,
  
  -- Metrics
  sessions_count INTEGER DEFAULT 0,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  average_accuracy DECIMAL(5,2),
  average_speed DECIMAL(10,2), -- seconds per question
  
  -- Trend Analysis
  trend_direction VARCHAR(50) CHECK (trend_direction IN ('improving', 'stable', 'declining')),
  trend_strength DECIMAL(5,2), -- Strength of the trend
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_user_trend FOREIGN KEY (user_id) REFERENCES kedge_practice.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_knowledge_trend FOREIGN KEY (knowledge_point_id) REFERENCES kedge_practice.knowledge_points(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_period_trend UNIQUE (user_id, knowledge_point_id, period_type, period_date)
);

-- =================================================================
-- FEEDBACK CONFIGURATION
-- =================================================================

-- Feedback templates for different scenarios
CREATE TABLE IF NOT EXISTS kedge_practice.feedback_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type VARCHAR(100) NOT NULL,
  condition_rules JSONB NOT NULL, -- Rules to determine when to use this template
  
  -- Template Content
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  encouragement_messages JSONB DEFAULT '[]', -- Array of encouragement phrases
  improvement_tips JSONB DEFAULT '[]', -- Array of improvement suggestions
  
  -- Visual Elements
  icon VARCHAR(255),
  color_scheme VARCHAR(50),
  animation_type VARCHAR(50),
  
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- INDEXES FOR PERFORMANCE
-- =================================================================

CREATE INDEX idx_session_analysis_session_id ON kedge_practice.session_analysis(session_id);
CREATE INDEX idx_session_analysis_user_id ON kedge_practice.session_analysis(user_id);
CREATE INDEX idx_session_analysis_created_at ON kedge_practice.session_analysis(created_at DESC);

CREATE INDEX idx_answer_feedback_answer_id ON kedge_practice.answer_feedback(answer_id);
CREATE INDEX idx_answer_feedback_session_id ON kedge_practice.answer_feedback(session_id);
CREATE INDEX idx_answer_feedback_quiz_id ON kedge_practice.answer_feedback(quiz_id);

CREATE INDEX idx_recommendations_user_id ON kedge_practice.learning_recommendations(user_id);
CREATE INDEX idx_recommendations_session_id ON kedge_practice.learning_recommendations(session_id);
CREATE INDEX idx_recommendations_not_completed ON kedge_practice.learning_recommendations(user_id, is_completed) WHERE NOT is_completed;

CREATE INDEX idx_achievements_user_id ON kedge_practice.achievements(user_id);
CREATE INDEX idx_achievements_unlocked ON kedge_practice.achievements(user_id, is_unlocked) WHERE is_unlocked;

CREATE INDEX idx_performance_trends_user ON kedge_practice.performance_trends(user_id, period_type, period_date);
CREATE INDEX idx_performance_trends_knowledge ON kedge_practice.performance_trends(knowledge_point_id, period_type, period_date);

-- =================================================================
-- TRIGGERS
-- =================================================================

CREATE TRIGGER set_session_analysis_updated_at BEFORE UPDATE ON kedge_practice.session_analysis
  FOR EACH ROW EXECUTE FUNCTION kedge_practice.set_current_timestamp_updated_at();

CREATE TRIGGER set_recommendations_updated_at BEFORE UPDATE ON kedge_practice.learning_recommendations
  FOR EACH ROW EXECUTE FUNCTION kedge_practice.set_current_timestamp_updated_at();

CREATE TRIGGER set_achievements_updated_at BEFORE UPDATE ON kedge_practice.achievements
  FOR EACH ROW EXECUTE FUNCTION kedge_practice.set_current_timestamp_updated_at();

CREATE TRIGGER set_performance_trends_updated_at BEFORE UPDATE ON kedge_practice.performance_trends
  FOR EACH ROW EXECUTE FUNCTION kedge_practice.set_current_timestamp_updated_at();

CREATE TRIGGER set_feedback_templates_updated_at BEFORE UPDATE ON kedge_practice.feedback_templates
  FOR EACH ROW EXECUTE FUNCTION kedge_practice.set_current_timestamp_updated_at();

-- =================================================================
-- STORED PROCEDURES FOR ANALYSIS
-- =================================================================

-- Function to calculate session performance metrics
CREATE OR REPLACE FUNCTION kedge_practice.calculate_session_metrics(p_session_id UUID)
RETURNS TABLE(
  accuracy DECIMAL,
  avg_time DECIMAL,
  consistency DECIMAL,
  improvement DECIMAL
) AS $$
DECLARE
  v_user_id UUID;
  v_accuracy DECIMAL;
  v_avg_time DECIMAL;
  v_consistency DECIMAL;
  v_improvement DECIMAL;
BEGIN
  -- Get user_id from session
  SELECT user_id INTO v_user_id FROM kedge_practice.practice_sessions WHERE id = p_session_id;
  
  -- Calculate accuracy
  SELECT 
    CASE WHEN COUNT(*) > 0 THEN 
      (COUNT(*) FILTER (WHERE is_correct))::DECIMAL / COUNT(*)::DECIMAL * 100
    ELSE 0 END
  INTO v_accuracy
  FROM kedge_practice.practice_answers
  WHERE session_id = p_session_id;
  
  -- Calculate average time
  SELECT AVG(time_spent_seconds)::DECIMAL
  INTO v_avg_time
  FROM kedge_practice.practice_answers
  WHERE session_id = p_session_id;
  
  -- Calculate consistency (standard deviation of answer times)
  SELECT 
    CASE WHEN COUNT(*) > 1 THEN
      100 - LEAST(100, STDDEV(time_spent_seconds)::DECIMAL * 2)
    ELSE 100 END
  INTO v_consistency
  FROM kedge_practice.practice_answers
  WHERE session_id = p_session_id;
  
  -- Calculate improvement (compared to last 5 sessions)
  WITH recent_sessions AS (
    SELECT accuracy_percentage
    FROM kedge_practice.session_analysis sa
    JOIN kedge_practice.practice_sessions ps ON sa.session_id = ps.id
    WHERE ps.user_id = v_user_id
      AND ps.id != p_session_id
    ORDER BY ps.created_at DESC
    LIMIT 5
  )
  SELECT 
    CASE WHEN COUNT(*) > 0 THEN
      v_accuracy - AVG(accuracy_percentage)
    ELSE 0 END
  INTO v_improvement
  FROM recent_sessions;
  
  RETURN QUERY SELECT v_accuracy, v_avg_time, v_consistency, COALESCE(v_improvement, 0);
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- DEFAULT FEEDBACK TEMPLATES
-- =================================================================

INSERT INTO kedge_practice.feedback_templates (template_type, condition_rules, title_template, message_template, encouragement_messages, improvement_tips) VALUES
  ('excellent_performance', 
   '{"min_accuracy": 90, "min_consistency": 80}',
   '🌟 Outstanding Performance!',
   'You scored {accuracy}% with excellent consistency. Keep up the amazing work!',
   '["You''re a star!", "Brilliant work!", "You''re mastering this!"]',
   '["Challenge yourself with harder topics", "Help others learn", "Maintain this momentum"]'),
   
  ('good_performance',
   '{"min_accuracy": 70, "max_accuracy": 89}',
   '👍 Good Job!',
   'You scored {accuracy}%. You''re doing well and showing solid understanding.',
   '["Well done!", "Keep going!", "You''re improving!"]',
   '["Review missed questions", "Practice similar problems", "Focus on weak areas"]'),
   
  ('needs_improvement',
   '{"max_accuracy": 69}',
   '💪 Room for Growth',
   'You scored {accuracy}%. Every practice session is a learning opportunity!',
   '["Don''t give up!", "You''re learning!", "Progress takes time!"]',
   '["Review fundamentals", "Take breaks between sessions", "Ask for help when needed"]'),
   
  ('speed_improvement',
   '{"improved_speed": true}',
   '⚡ Getting Faster!',
   'Your response time improved by {speed_improvement}%!',
   '["Speed and accuracy!", "Quick thinking!", "Efficiency improved!"]',
   '["Maintain accuracy while speeding up", "Practice time management", "Use shortcuts wisely"]'),
   
  ('consistency_achievement',
   '{"min_consistency": 85}',
   '🎯 Consistent Performance!',
   'Your answers show great consistency at {consistency}%!',
   '["Steady progress!", "Reliable performance!", "Well-balanced!"]',
   '["Keep this rhythm", "Apply this consistency to all topics", "Share your study methods"]')
ON CONFLICT DO NOTHING;

-- =================================================================
-- COMMENTS
-- =================================================================

COMMENT ON TABLE kedge_practice.session_analysis IS 'Comprehensive analysis of completed practice sessions';
COMMENT ON TABLE kedge_practice.answer_feedback IS 'Detailed feedback for individual question answers';
COMMENT ON TABLE kedge_practice.learning_recommendations IS 'Personalized learning recommendations based on performance';
COMMENT ON TABLE kedge_practice.achievements IS 'User achievements and milestones tracking';
COMMENT ON TABLE kedge_practice.performance_trends IS 'Historical performance trends by time period';
COMMENT ON TABLE kedge_practice.feedback_templates IS 'Configurable feedback message templates';