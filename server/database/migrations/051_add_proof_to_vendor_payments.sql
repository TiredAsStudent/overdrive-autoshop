-- 051_add_proof_to_vendor_payments.sql
-- Purpose: Adds documentary proof tracking for Accounts Payable liquidations.

ALTER TABLE vendor_payments
ADD COLUMN IF NOT EXISTS proof_of_payment_url VARCHAR(500);

-- Documentation
COMMENT ON COLUMN vendor_payments.proof_of_payment_url IS 'Relative path to uploaded bank slip, check voucher, or digital payment receipt.';