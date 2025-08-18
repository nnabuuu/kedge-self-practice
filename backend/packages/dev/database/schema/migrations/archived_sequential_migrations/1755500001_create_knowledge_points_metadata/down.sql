-- Drop metadata table and related functions
DROP TRIGGER IF EXISTS trigger_update_knowledge_points_metadata_timestamp ON kedge_practice.knowledge_points_metadata;
DROP FUNCTION IF EXISTS public.update_knowledge_points_metadata_timestamp();
DROP TABLE IF EXISTS kedge_practice.knowledge_points_metadata;