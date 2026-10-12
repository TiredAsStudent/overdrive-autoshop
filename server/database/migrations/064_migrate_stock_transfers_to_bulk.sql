-- 064_migrate_stock_transfers_to_bulk.sql
-- Purpose: Normalizes stock_transfers to support multi-item manifests.

BEGIN;

-- 1. Create the new child table for line items
CREATE TABLE IF NOT EXISTS stock_transfer_items (
    id SERIAL PRIMARY KEY,
    transfer_id INT NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    item_id INT NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    recorded_unit_cost NUMERIC(10, 2) NOT NULL CHECK (recorded_unit_cost >= 0)
);

-- 2. Migrate existing single-item transfers into the child table
INSERT INTO stock_transfer_items (transfer_id, item_id, quantity, recorded_unit_cost)
SELECT id, item_id, quantity, recorded_unit_cost 
FROM stock_transfers;

-- 3. Add aggregated summary columns to the header table
ALTER TABLE stock_transfers
ADD COLUMN IF NOT EXISTS total_items INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_quantity INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_asset_value NUMERIC(10, 2) DEFAULT 0.00;

-- 4. Backfill summary data for existing records
UPDATE stock_transfers
SET 
    total_quantity = quantity,
    total_asset_value = quantity * recorded_unit_cost;

-- 5. Safely drop the obsolete flat columns from the header
ALTER TABLE stock_transfers 
DROP COLUMN IF EXISTS item_id,
DROP COLUMN IF EXISTS quantity,
DROP COLUMN IF EXISTS recorded_unit_cost;

-- 6. Add performance indexes for the new child table
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_transfer ON stock_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_item ON stock_transfer_items(item_id);

COMMIT;