-- Create system configuration table
CREATE TABLE IF NOT EXISTS kedge_practice.system_config (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION kedge_practice.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_system_config_updated_at ON kedge_practice.system_config;
CREATE TRIGGER update_system_config_updated_at 
    BEFORE UPDATE ON kedge_practice.system_config 
    FOR EACH ROW 
    EXECUTE FUNCTION kedge_practice.update_updated_at_column();

-- Insert default configuration
INSERT INTO kedge_practice.system_config (key, value, description) VALUES
    ('show_demo_accounts', '{"enabled": true}', 'Whether to show demo account quick login buttons on the login page')
ON CONFLICT (key) DO NOTHING;

-- Add comment
COMMENT ON TABLE kedge_practice.system_config IS 'System-wide configuration settings';
COMMENT ON COLUMN kedge_practice.system_config.key IS 'Configuration key identifier';
COMMENT ON COLUMN kedge_practice.system_config.value IS 'Configuration value in JSON format';
COMMENT ON COLUMN kedge_practice.system_config.description IS 'Human-readable description of the configuration';