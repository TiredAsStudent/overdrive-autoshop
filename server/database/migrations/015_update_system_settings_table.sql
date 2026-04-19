-- 015_update_system_settings_table.sql

-- Add branding and contact columns
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS company_name VARCHAR(150) DEFAULT 'Overdrive Auto Shop',
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100),
ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Ensure the singleton master row exists
INSERT INTO system_settings (id, company_name, vat_percentage, markup_percentage)
VALUES (1, 'Overdrive Auto Shop', 12.00, 25.00)
ON CONFLICT (id) DO NOTHING;