-- 010_update_inventory_for_branches.sql

-- Remove the global stock column from the master catalogue
ALTER TABLE inventory DROP COLUMN IF EXISTS stock_quantity;

-- Create the Branch-Specific Stock table
CREATE TABLE IF NOT EXISTS branch_inventory (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
    branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0, -- The "Blue" status for Step 2: Sales Orders
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(inventory_id, branch_id) -- Ensures only one record per part, per branch
);

-- High-Performance Indexing
CREATE INDEX idx_branch_inventory_lookup ON branch_inventory(inventory_id, branch_id);