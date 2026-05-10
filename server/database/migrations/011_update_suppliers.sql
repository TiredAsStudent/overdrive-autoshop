-- 011_update_suppliers.sql

-- Upgrade the existing suppliers table
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100),
ADD COLUMN IF NOT EXISTS email VARCHAR(150),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add an index to speed up the Ledger Aggregation queries
CREATE INDEX IF NOT EXISTS idx_expenses_supplier_id ON expenses(supplier_id);