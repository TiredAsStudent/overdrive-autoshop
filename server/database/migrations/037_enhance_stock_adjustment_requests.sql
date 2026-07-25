-- 037_enhance_stock_adjustment_requests.sql
-- Purpose: Adds snapshot columns to prevent race conditions and a unique identifier for FRS compliance.

ALTER TABLE stock_adjustment_requests
ADD COLUMN IF NOT EXISTS adjustment_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS current_system_quantity INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS physical_count INT DEFAULT 0;

UPDATE stock_adjustment_requests 
SET adjustment_number = 'ADJ-' || LPAD(id::text, 5, '0') 
WHERE adjustment_number IS NULL;