-- 017_enhance_inventory_and_movements.sql
-- Purpose: Upgrade Master Catalog and Establish Immutable Movement History

-- 1. Safely add new columns to the existing Master Items table
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS uom VARCHAR(50) DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS default_reorder_level INT DEFAULT 5 CHECK (default_reorder_level >= 0);

-- 2. Define standard transaction types for the Ledger
DO $$ BEGIN
    CREATE TYPE inventory_transaction_type AS ENUM (
        'INITIALIZATION', 'BILL_RECEIVED', 'SALES_INVOICE', 
        'MANUAL_ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create the Immutable Stock Ledger (Movement History)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES inventory_items(id) ON DELETE RESTRICT,
    branch_id INT REFERENCES branches(id) ON DELETE RESTRICT,
    transaction_type inventory_transaction_type NOT NULL,
    transaction_reference VARCHAR(100), -- e.g., 'Bill #1002', 'Invoice #994'
    quantity_added INT DEFAULT 0 CHECK (quantity_added >= 0),
    quantity_deducted INT DEFAULT 0 CHECK (quantity_deducted >= 0),
    remaining_quantity INT NOT NULL CHECK (remaining_quantity >= 0),
    remarks TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create performance indexes for rapid history extraction
CREATE INDEX idx_inv_movements_item ON inventory_movements(item_id);
CREATE INDEX idx_inv_movements_branch ON inventory_movements(branch_id);
CREATE INDEX idx_inv_movements_date ON inventory_movements(created_at);