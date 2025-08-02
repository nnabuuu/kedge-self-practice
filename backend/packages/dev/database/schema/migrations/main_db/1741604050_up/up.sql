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


-- Users table
CREATE TABLE kedge_gateway.users (
                                   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                   name VARCHAR(255) NOT NULL UNIQUE,
                                   password_hash TEXT NOT NULL,
                                   salt TEXT NOT NULL,
                                   role VARCHAR(50) NOT NULL DEFAULT 'user',
                                   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add updated_at auto-update trigger for users
CREATE TRIGGER trigger_set_timestamp_users
  BEFORE UPDATE ON kedge_gateway.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();
