-- Add missing columns to practice_sessions table
-- These columns are needed for tracking session progress

ALTER TABLE kedge_practice.practice_sessions
ADD COLUMN IF NOT EXISTS answered_questions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS incorrect_answers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS skipped_questions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;