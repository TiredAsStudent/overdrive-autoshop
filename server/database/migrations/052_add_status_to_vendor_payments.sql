-- 052_add_status_to_vendor_payments.sql
-- Purpose: Adds the status column to support the Void Disbursement error-recovery workflow.

ALTER TABLE vendor_payments 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'VOID'));

-- Documentation
COMMENT ON COLUMN vendor_payments.status IS 'Tracks whether the payment is valid (COMPLETED) or reversed (VOID).';