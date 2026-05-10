-- Table 1: Master Parts Catalog (The Definition)
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

-- Table 2: Branch-Specific Stock Levels (The Reality)
CREATE TABLE IF NOT EXISTS branch_inventory (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE RESTRICT,
    item_id INT REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity INT DEFAULT 0, 
    reorder_point INT DEFAULT 5, 
    last_restock_date TIMESTAMP,
    UNIQUE(branch_id, item_id) 
);

-- Seed Initial Master Data
INSERT INTO inventory_items (sku, item_name, category, unit_cost, selling_price)
VALUES 
('OIL-SYN-4L', 'Full Synthetic Motor Oil (4L)', 'Fluids', 1200.00, 1800.00),
('FLT-OIL-TYT', 'Toyota Genuine Oil Filter', 'Filters', 250.00, 450.00),
('BRK-PAD-VS', 'Brake Pads (Vios/Yaris)', 'Brakes', 800.00, 1500.00)
ON CONFLICT (sku) DO NOTHING;

-- ==========================================
-- DYNAMIC SEED: Distribute Master Parts to ALL active branches with 0 stock
-- ==========================================
INSERT INTO branch_inventory (branch_id, item_id, quantity, reorder_point)
SELECT b.id, i.id, 0, 5 
FROM branches b
CROSS JOIN inventory_items i
WHERE b.is_active = TRUE
ON CONFLICT (branch_id, item_id) DO NOTHING;