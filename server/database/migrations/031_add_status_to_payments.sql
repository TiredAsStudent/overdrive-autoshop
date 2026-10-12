-- 031_add_status_to_payments.sql

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'VALID' CHECK (status IN ('VALID', 'VOID'));