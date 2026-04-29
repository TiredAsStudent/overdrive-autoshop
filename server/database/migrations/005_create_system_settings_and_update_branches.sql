-- 005_create_system_settings_and_update_branches.sql

-- Create the system_settings table (Designed to hold exactly 1 row)
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    markup_percentage DECIMAL(5,2) NOT NULL DEFAULT 25.00,
    vat_percentage DECIMAL(5,2) NOT NULL DEFAULT 12.00,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert the default baseline row
INSERT INTO system_settings (id, markup_percentage, vat_percentage) 
VALUES (1, 25.00, 12.00) 
ON CONFLICT (id) DO NOTHING;

-- Update the branches table to hold physical details and audit timestamps
ALTER TABLE branches
ADD COLUMN IF NOT EXISTS address VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();