-- Create practice schema and tables
CREATE SCHEMA IF NOT EXISTS kedge_practice;

-- Knowledge points table
CREATE TABLE IF NOT EXISTS kedge_practice.knowledge_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  volume TEXT NOT NULL,
  unit TEXT NOT NULL,
  lesson TEXT NOT NULL,
  sub TEXT NOT NULL
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS kedge_practice.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  answer JSONB NOT NULL,
  original_paragraph TEXT
);
