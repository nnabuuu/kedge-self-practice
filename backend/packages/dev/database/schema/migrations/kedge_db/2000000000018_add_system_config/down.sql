-- Drop trigger and function
DROP TRIGGER IF EXISTS update_system_config_updated_at ON kedge_practice.system_config;
DROP FUNCTION IF EXISTS kedge_practice.update_updated_at_column();

-- Drop table
DROP TABLE IF EXISTS kedge_practice.system_config;