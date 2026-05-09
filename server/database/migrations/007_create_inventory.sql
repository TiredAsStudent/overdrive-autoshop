-- 007_create_inventory.sql

-- Table 1: Master Parts Catalog (The Definition)
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL, -- Stock Keeping Unit (e.g., OIL-SYN-4L)
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g., Fluids, Filters, Underchassis, Brakes
    unit_cost NUMERIC(10, 2) DEFAULT 0.00 CHECK (unit_cost >= 0), -- Base for COGS (Account 5000) and Assets (1200)
    selling_price NUMERIC(10, 2) DEFAULT 0.00 CHECK (selling_price >= 0), -- Base for Parts Revenue (Account 4002)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 2: Branch-Specific Stock Levels (The Reality)
CREATE TABLE IF NOT EXISTS branch_inventory (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE RESTRICT,
    item_id INT REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity INT DEFAULT 0, 
    reorder_point INT DEFAULT 5, -- Triggers the "Low Stock" UI alert
    last_restock_date TIMESTAMP,
    UNIQUE(branch_id, item_id) -- Prevents duplicate tracking rows for the same part in the same branch
);

-- Seed Initial Master Data
INSERT INTO inventory_items (sku, item_name, category, unit_cost, selling_price)
VALUES 
('OIL-SYN-4L', 'Full Synthetic Motor Oil (4L)', 'Fluids', 1200.00, 1800.00),
('FLT-OIL-TYT', 'Toyota Genuine Oil Filter', 'Filters', 250.00, 450.00),
('BRK-PAD-VS', 'Brake Pads (Vios/Yaris)', 'Brakes', 800.00, 1500.00)
ON CONFLICT (sku) DO NOTHING;

-- Seed Branch Inventory (Assuming Branch ID 1 is Biñan and Branch ID 2 is Batino)
INSERT INTO branch_inventory (branch_id, item_id, quantity, reorder_point)
SELECT 1, id, 12, 5 FROM inventory_items WHERE sku = 'OIL-SYN-4L'
ON CONFLICT DO NOTHING;

INSERT INTO branch_inventory (branch_id, item_id, quantity, reorder_point)
SELECT 1, id, 8, 10 FROM inventory_items WHERE sku = 'FLT-OIL-TYT'
ON CONFLICT DO NOTHING;

INSERT INTO branch_inventory (branch_id, item_id, quantity, reorder_point)
SELECT 2, id, 3, 5 FROM inventory_items WHERE sku = 'OIL-SYN-4L'
ON CONFLICT DO NOTHING;