-- 039_update_audit_logs_target_id.sql
-- Purpose: Changes target_id to VARCHAR to support both INT (legacy tables) and UUID (receipt_scans)

ALTER TABLE audit_logs 
ALTER COLUMN target_id TYPE VARCHAR(255) USING target_id::VARCHAR;

-- Documentation
COMMENT ON COLUMN audit_logs.target_id IS 'Can hold INT (e.g., invoices) or UUID (e.g., receipt_scans)';