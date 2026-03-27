-- Migration: 007_inventory_engine
-- Description: Creates Local Stock (Shelves) and the Maker-Checker Adjustment Protocol

-- Create the Local Stock Table (The Shelves)
CREATE TABLE IF NOT EXISTS branch_local_stock (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE RESTRICT,
    master_part_id INTEGER REFERENCES master_inventory(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, master_part_id) -- A branch can only have one tracking row per part
);

-- Create the Maker-Checker Status ENUM safely
DO $$ BEGIN
    CREATE TYPE adjustment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the Inventory Adjustments Table (Security API)
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE RESTRICT,
    master_part_id INTEGER REFERENCES master_inventory(id) ON DELETE CASCADE,
    requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    quantity_change INTEGER NOT NULL, -- e.g., -1 for a broken bottle of oil
    reason TEXT NOT NULL,
    status adjustment_status DEFAULT 'PENDING',
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);