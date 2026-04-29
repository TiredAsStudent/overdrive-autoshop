-- 009a_create_inventory_table.sql

CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    item_code VARCHAR(100) UNIQUE,
    item_name VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    unit_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    last_restocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_name_active ON inventory(item_name, is_active);