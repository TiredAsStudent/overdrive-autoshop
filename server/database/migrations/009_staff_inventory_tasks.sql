-- Migration: 009_staff_inventory_tasks
-- Description: Creates the Transfer Request Maker-Checker table

-- Create the Transfer Requests Table (Security API for Inter-Branch moves)
CREATE TABLE IF NOT EXISTS stock_transfer_requests (
    id SERIAL PRIMARY KEY,
    from_branch_id INTEGER REFERENCES branches(id) ON DELETE RESTRICT,
    to_branch_id INTEGER REFERENCES branches(id) ON DELETE RESTRICT,
    master_part_id INTEGER REFERENCES master_inventory(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status adjustment_status DEFAULT 'PENDING', -- Reusing the ENUM from Migration 007
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);