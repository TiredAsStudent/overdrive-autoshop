-- 013_create_backup_logs.sql

CREATE TABLE IF NOT EXISTS backup_logs (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) UNIQUE NOT NULL,
    backup_type VARCHAR(50) NOT NULL CHECK (backup_type IN ('AUTOMATED', 'MANUAL')),
    file_size_mb NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED')),
    executed_by INT REFERENCES users(id) ON DELETE SET NULL, -- NULL indicates SYSTEM AUTOMATION
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexing for fast dashboard retrieval
CREATE INDEX idx_backup_logs_created_at ON backup_logs(created_at DESC);