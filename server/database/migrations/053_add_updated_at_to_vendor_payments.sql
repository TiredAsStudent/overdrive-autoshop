-- 053_add_updated_at_to_vendor_payments.sql
-- Purpose: Adds the missing updated_at column to the vendor_payments table 
-- to support auditability when a disbursement is VOIDED.

ALTER TABLE vendor_payments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Documentation
COMMENT ON COLUMN vendor_payments.updated_at IS 'Tracks the timestamp when the payment status is altered (e.g., Voided).';