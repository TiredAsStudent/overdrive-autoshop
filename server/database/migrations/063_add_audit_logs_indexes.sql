-- 063_add_audit_logs_indexes.sql
-- Purpose: Optimize the System Admin Dashboard's recent log extraction query
-- preventing full sequential scans as the logging table grows over time.

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc 
ON audit_logs(created_at DESC);

-- Documentation
COMMENT ON INDEX idx_audit_logs_created_at_desc IS 'Accelerates the "Recent Audit Logs" dashboard feed by sorting the table inherently.';