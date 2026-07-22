-- 035_add_payment_status_to_bills.sql
-- Purpose: Safely add the payment status tracking to the existing bills table.

-- 1. Create the new Enum for Payment Status
DO $$ BEGIN
    CREATE TYPE bill_payment_status_enum AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add the column to the existing table with a default value
ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS payment_status bill_payment_status_enum DEFAULT 'UNPAID';

-- 3. Create the performance index for the new column
CREATE INDEX IF NOT EXISTS idx_bills_payment_status ON bills(branch_id, payment_status);