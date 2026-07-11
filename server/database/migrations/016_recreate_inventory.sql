-- 016_recreate_inventory.sql
-- Purpose: Rebuild Master Inventory and Branch Allocation Tables

-- 1. Master Parts Catalog (The Dictionary)
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL, 
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, 
    unit_cost NUMERIC(10, 2) DEFAULT 0.00 CHECK (unit_cost >= 0), 
    selling_price NUMERIC(10, 2) DEFAULT 0.00 CHECK (selling_price >= 0), 
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Branch-Specific Stock Levels (The Operational Reality)
CREATE TABLE IF NOT EXISTS branch_inventory (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE RESTRICT,
    item_id INT REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity INT DEFAULT 0 CHECK (quantity >= 0), -- BR-04: Cannot drop below 0
    reorder_point INT DEFAULT 5 CHECK (reorder_point >= 0), 
    last_restock_date TIMESTAMP,
    UNIQUE(branch_id, item_id) 
);

-- 3. Optimization Indexes for Cross-Branch Queries
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_branch_inventory_item ON branch_inventory(item_id);
CREATE INDEX idx_branch_inventory_branch ON branch_inventory(branch_id);