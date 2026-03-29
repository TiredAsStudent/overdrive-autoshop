-- Migration: 010_estimates
-- Description: Creates the Master-Detail tables for Draft Quotes

-- The Estimate Status ENUM
DO $$ BEGIN
    CREATE TYPE estimate_status AS ENUM ('DRAFT', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- The Item Type ENUM
DO $$ BEGIN
    CREATE TYPE line_item_type AS ENUM ('PART', 'LABOR', 'PACKAGE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- The MASTER Table (The Quote Header)
CREATE TABLE IF NOT EXISTS estimates (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE RESTRICT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    vehicle_plate VARCHAR(50), 
    status estimate_status DEFAULT 'DRAFT',
    total_parts NUMERIC(10, 2) DEFAULT 0.00,
    total_labor NUMERIC(10, 2) DEFAULT 0.00,
    grand_total NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- The DETAIL Table (The Individual Line Items)
CREATE TABLE IF NOT EXISTS estimate_line_items (
    id SERIAL PRIMARY KEY,
    estimate_id INTEGER REFERENCES estimates(id) ON DELETE CASCADE,
    item_type line_item_type NOT NULL,
    reference_id INTEGER, -- Links to master_part_id or service_template_id (NULL if custom manual entry)
    item_name VARCHAR(255) NOT NULL, -- Snapshot of the name so historical quotes don't change
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);