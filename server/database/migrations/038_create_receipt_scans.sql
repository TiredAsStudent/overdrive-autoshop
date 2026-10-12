-- 038_create_receipt_scans.sql
-- Purpose: Staging table for OCR-extracted data (Zero Ledger Impact)

-- 1. Status Enum
DO $$ BEGIN
    CREATE TYPE receipt_scan_status_enum AS ENUM (
        'UPLOADING', 'PROCESSING', 'PENDING_VERIFICATION', 'VERIFIED', 'DISCARDED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Staging Table (Using UUID to prevent URL ID guessing)
CREATE TABLE IF NOT EXISTS receipt_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    uploaded_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- File Metadata
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- OCR Extraction Engine Results
    raw_ocr_text TEXT,
    extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (confidence_score >= 0.00 AND confidence_score <= 100.00),
    
    status receipt_scan_status_enum DEFAULT 'PROCESSING',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Performance Indexes
CREATE INDEX idx_receipt_scans_branch ON receipt_scans(branch_id);
CREATE INDEX idx_receipt_scans_status ON receipt_scans(status);