-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the schema
CREATE SCHEMA IF NOT EXISTS kedge_gateway;

-- Trigger function to update the updated_at column
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS
$$
DECLARE
_new record;
BEGIN
    _new := NEW;
    _new.updated_at = NOW();
RETURN _new;
END;
$$
LANGUAGE plpgsql;

-- Devices table
CREATE TABLE kedge_gateway.devices (
                                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                     name VARCHAR(255),
                                     user_id UUID NOT NULL REFERENCES kedge_gateway.users(id),
                                     owner_address VARCHAR(42),
                                     reward_address VARCHAR(42),
                                     status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in-progress', 'connected', 'disconnected', 'failed')),
                                     device_type VARCHAR(255),
  -- Hardware Info
                                     cpu_model VARCHAR(255),
                                     cpu_cores INTEGER,
                                     cpu_threads INTEGER,
                                     cpu_usage_percent DECIMAL(5,2),
                                     ram_total BIGINT,
                                     ram_available BIGINT,
                                     gpu_model VARCHAR(255),
                                     gpu_count INTEGER,
                                     gpu_memory BIGINT,
                                     gpu_temperature DECIMAL(5,2),
                                     disk_total BIGINT,
                                     disk_available BIGINT,
  -- Network Info
                                     ip_address VARCHAR(45),
                                     last_ping TIMESTAMPTZ,
                                     latency INTEGER,
  -- Runtime Info
                                     uptime_seconds BIGINT,
                                     last_boot TIMESTAMPTZ,
                                     os_info TEXT,
  -- Metadata
                                     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                     last_error TEXT,
                                     firmware_version VARCHAR(50),
                                     software_version VARCHAR(50),
                                     last_maintenance_at TIMESTAMPTZ,
                                     next_maintenance_at TIMESTAMPTZ,
                                     health_score INTEGER,
                                     tags TEXT[]
);

-- Indexes
CREATE INDEX idx_devices_status ON kedge_gateway.devices(status);
CREATE INDEX idx_devices_user ON kedge_gateway.devices(user_id);

-- Tasks table
CREATE TABLE kedge_gateway.tasks (
                                   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                   user_id UUID,
                                   model TEXT NOT NULL,
                                   type TEXT NOT NULL,    -- e.g., 'generate' | 'chat', validated by app
                                   payload TEXT NOT NULL,
                                   status TEXT NOT NULL,  -- e.g., 'pending' | 'running' | ..., validated by app
                                   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add updated_at auto-update trigger for devices
CREATE TRIGGER trigger_set_timestamp_devices
  BEFORE UPDATE ON kedge_gateway.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Add updated_at auto-update trigger for tasks
CREATE TRIGGER trigger_set_timestamp_tasks
  BEFORE UPDATE ON kedge_gateway.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();
