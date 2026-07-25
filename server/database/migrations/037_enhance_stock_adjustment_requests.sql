-- 037_enhance_stock_adjustment_requests.sql
-- Purpose: Adds snapshot columns to prevent race conditions and a unique identifier for FRS compliance.

ALTER TABLE stock_adjustment_requests
ADD COLUMN IF NOT EXISTS adjustment_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS current_system_quantity INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS physical_count INT DEFAULT 0;

-- Optional: If you want to backfill existing rows (if any exist)
UPDATE stock_adjustment_requests 
SET adjustment_number = 'ADJ-LEGACY-' || id 
WHERE adjustment_number IS NULL;