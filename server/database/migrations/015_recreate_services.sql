-- 015_recreate_services.sql
-- Purpose: Safely recreate the services table with explicit category enums and financial constraints.

-- 1. Create the Category Enum
DROP TYPE IF EXISTS service_category_enum CASCADE;
CREATE TYPE service_category_enum AS ENUM (
    'Engine', 'Transmission', 'Brake System', 'Suspension', 
    'Cooling System', 'Electrical', 'Air Conditioning', 'Steering', 
    'Preventive Maintenance', 'Tire Services', 'General Repair'
);

-- 2. Create the Table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    service_code VARCHAR(20) UNIQUE NOT NULL, 
    service_name VARCHAR(150) NOT NULL,
    category service_category_enum NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    estimated_minutes INT DEFAULT 60 CHECK (estimated_minutes > 0),
    commonly_used_parts UUID[] DEFAULT '{}', -- Reference Array
    is_vatable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- VR-07: Duplicate Service Names are forbidden within the SAME category.
    CONSTRAINT unique_service_name_per_category UNIQUE (category, service_name)
);

-- 3. Create Performance Indexes
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_status ON services(is_active);
CREATE INDEX idx_services_code ON services(service_code);