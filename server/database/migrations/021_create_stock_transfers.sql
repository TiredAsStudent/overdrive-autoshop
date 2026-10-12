-- 021_create_stock_transfers.sql
-- Purpose: Master tracking table for Inter-Branch Asset Redistribution

CREATE TABLE IF NOT EXISTS stock_transfers (
    id SERIAL PRIMARY KEY,
    transfer_reference VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'ST-2026-10045'
    item_id INT REFERENCES inventory_items(id) ON DELETE RESTRICT,
    source_branch_id INT REFERENCES branches(id) ON DELETE RESTRICT,
    destination_branch_id INT REFERENCES branches(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    recorded_unit_cost NUMERIC(10, 2) NOT NULL, -- Freezes the financial asset value during transit
    reason TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance Indexes for filtering large enterprise datasets
CREATE INDEX idx_stock_transfers_source ON stock_transfers(source_branch_id);
CREATE INDEX idx_stock_transfers_dest ON stock_transfers(destination_branch_id);
CREATE INDEX idx_stock_transfers_date ON stock_transfers(created_at);