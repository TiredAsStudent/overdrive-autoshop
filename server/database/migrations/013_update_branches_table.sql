-- 013_update_branches_table.sql

-- Add the new accounting and security columns to the existing branches table
ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS branch_code VARCHAR(10) UNIQUE,
ADD COLUMN IF NOT EXISTS tin VARCHAR(50),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100),
ADD COLUMN IF NOT EXISTS invoice_header TEXT,
ADD COLUMN IF NOT EXISTS invoice_footer TEXT,
ADD COLUMN IF NOT EXISTS is_maintenance_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create an index to speed up branch code lookups
CREATE INDEX IF NOT EXISTS idx_branches_branch_code ON branches(branch_code);