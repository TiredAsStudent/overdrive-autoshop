-- 009b_create_services_tables.sql

-- The Parent Table (The Combo Meal)
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    labor_fee DECIMAL(12, 2) NOT NULL CHECK (labor_fee >= 0),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- The Junction Table (The Ingredients)
CREATE TABLE IF NOT EXISTS service_parts (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE RESTRICT,
    quantity_required DECIMAL(10, 2) NOT NULL CHECK (quantity_required > 0),
    UNIQUE(service_id, inventory_id)
);

-- High-Performance Indexes
CREATE INDEX idx_services_category_active ON services(category, is_active);
CREATE INDEX idx_service_parts_service_id ON service_parts(service_id);