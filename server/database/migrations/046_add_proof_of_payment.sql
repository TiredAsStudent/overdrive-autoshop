-- 046_add_proof_of_payment.sql
-- Purpose: Adds an audit trail column for photo evidence of digital payments.

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS proof_of_payment_url VARCHAR(500);

-- Documentation
COMMENT ON COLUMN payments.proof_of_payment_url IS 'Relative path to the uploaded deposit slip or e-wallet screenshot.';