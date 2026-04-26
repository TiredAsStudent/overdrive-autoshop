-- 024_update_ocr_tables.sql

ALTER TABLE receipt_scans 
ADD COLUMN IF NOT EXISTS rejection_note TEXT;