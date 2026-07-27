-- 040_link_receipts_to_expenses.sql
-- Purpose: Safely alter the expenses table to store OCR linkages, file paths, 
-- and verified line items without requiring a separate relational table.

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS scan_id UUID UNIQUE REFERENCES receipt_scans(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS receipt_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(150),
ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]'::jsonb;

-- Optimization Index for joining expenses back to their OCR origins
CREATE INDEX IF NOT EXISTS idx_expenses_scan_id ON expenses(scan_id);