-- Drop the attachments table and related objects
DROP TRIGGER IF EXISTS update_attachments_updated_at ON kedge_practice.attachments;
DROP FUNCTION IF EXISTS kedge_practice.update_attachments_updated_at();
DROP TABLE IF EXISTS kedge_practice.attachments;