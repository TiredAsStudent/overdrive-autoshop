-- 020_create_stock_adjustment_requests.sql
-- Purpose: Staging table for the Approval-Based Stock Adjustment Workflow

DO $$ BEGIN
    CREATE TYPE adjustment_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    CREATE TYPE adjustment_type_enum AS ENUM ('ADD', 'DEDUCT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS stock_adjustment_requests (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES inventory_items(id) ON DELETE RESTRICT,
    branch_id INT REFERENCES branches(id) ON DELETE RESTRICT,
    requested_by INT REFERENCES users(id) ON DELETE SET NULL,
    adjustment_type adjustment_type_enum NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    reason adjustment_reason_enum NOT NULL,
    staff_remarks TEXT,
    status adjustment_status_enum DEFAULT 'PENDING',
    manager_remarks TEXT,
    resolved_by INT REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Performance Indexes for the Manager Inbox
CREATE INDEX idx_adj_req_status ON stock_adjustment_requests(status);
CREATE INDEX idx_adj_req_branch ON stock_adjustment_requests(branch_id);