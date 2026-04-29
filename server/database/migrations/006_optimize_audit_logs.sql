-- 006_optimize_audit_logs.sql

-- Ensure the audit_logs table exists (matching your existing structure)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_resource VARCHAR(100),
    target_id INTEGER,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add high-performance indexes for searching and filtering
-- Speeds up filtering by Date
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Speeds up filtering by Branch
CREATE INDEX IF NOT EXISTS idx_audit_logs_branch_id ON audit_logs(branch_id);

-- Speeds up searching text within the action column
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs USING btree (action);