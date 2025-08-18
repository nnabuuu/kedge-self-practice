-- Create metadata table to track knowledge points hash and mappings
-- This allows us to bootstrap knowledge points from Excel while keeping UUID schema

CREATE TABLE IF NOT EXISTS kedge_practice.knowledge_points_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create trigger to update timestamp
CREATE OR REPLACE FUNCTION public.update_knowledge_points_metadata_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_points_metadata_timestamp
  BEFORE UPDATE ON kedge_practice.knowledge_points_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_knowledge_points_metadata_timestamp();