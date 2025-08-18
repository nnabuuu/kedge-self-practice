-- Create attachments table to store file metadata
CREATE TABLE IF NOT EXISTS kedge_practice.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id VARCHAR(255) NOT NULL UNIQUE, -- The UUID part of the filename
  original_name VARCHAR(500) NOT NULL,
  stored_name VARCHAR(500) NOT NULL,
  file_extension VARCHAR(50) NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_path VARCHAR(1000) NOT NULL, -- Full relative path like "2025/08/uuid.ext"
  file_hash VARCHAR(64), -- SHA256 hash for deduplication
  entity_type VARCHAR(100) DEFAULT 'quiz', -- Type of entity this attachment belongs to
  entity_id UUID, -- ID of the related entity (quiz_id, etc.)
  uploaded_by UUID, -- User who uploaded the file
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accessed_at TIMESTAMPTZ, -- Last access time for cleanup purposes
  metadata JSONB DEFAULT '{}', -- Additional metadata
  is_public BOOLEAN DEFAULT true, -- Whether the file is publicly accessible
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_attachments_file_id ON kedge_practice.attachments(file_id);
CREATE INDEX idx_attachments_entity ON kedge_practice.attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_uploaded_by ON kedge_practice.attachments(uploaded_by);
CREATE INDEX idx_attachments_uploaded_at ON kedge_practice.attachments(uploaded_at);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION kedge_practice.update_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_attachments_updated_at
  BEFORE UPDATE ON kedge_practice.attachments
  FOR EACH ROW
  EXECUTE FUNCTION kedge_practice.update_attachments_updated_at();

-- Migrate existing file references (if we know about them)
-- This is a placeholder - in production, you'd need to scan the file system
-- and populate this table with existing attachments