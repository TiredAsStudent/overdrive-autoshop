-- Migration: 005_service_templates
-- Description: Creates Master Inventory Stub and the Parent-Child Service Templates

-- Foundational Table for Phase 2 (Needed now for linking)
CREATE TABLE IF NOT EXISTS master_inventory (
    id SERIAL PRIMARY KEY,
    part_name VARCHAR(150) NOT NULL UNIQUE,
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    retail_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- Create the Service Templates (The Parent "Combo Meal")
CREATE TABLE IF NOT EXISTS service_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    labor_cost NUMERIC(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Template Items (The Children "Ingredients")
CREATE TABLE IF NOT EXISTS service_template_items (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES service_templates(id) ON DELETE CASCADE,
    master_part_id INTEGER REFERENCES master_inventory(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1
);