-- 020_enhance_audit_logs.sql

-- Create Severity ENUM
CREATE TYPE audit_severity AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- Add new columns to existing audit_logs table
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS severity audit_severity DEFAULT 'INFO',
ADD COLUMN IF NOT EXISTS old_values JSONB,
ADD COLUMN IF NOT EXISTS new_values JSONB;

-- Add index for severity to speed up Security threat filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);