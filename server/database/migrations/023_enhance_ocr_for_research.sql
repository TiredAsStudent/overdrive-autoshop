-- 023_enhance_ocr_for_research.sql

-- Add tracking and tax columns to receipt_scans
ALTER TABLE receipt_scans 
ADD COLUMN IF NOT EXISTS file_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS ai_metadata JSONB,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12, 2) DEFAULT 0.00;

-- Create an index to make duplicate checking lightning fast
CREATE INDEX IF NOT EXISTS idx_receipt_scans_hash ON receipt_scans(file_hash);