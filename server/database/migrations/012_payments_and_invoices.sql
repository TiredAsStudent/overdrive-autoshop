-- Migration: 012_payments_and_invoices
-- Description: Creates the financial ledger and PAID status

-- Upgrade the Status ENUM to include 'PAID'
ALTER TYPE estimate_status ADD VALUE IF NOT EXISTS 'PAID';

-- The Payment Method ENUM
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('CASH', 'GCASH', 'BANK_TRANSFER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- The Financial Ledger Table (The 'payments' table)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    estimate_id INTEGER REFERENCES estimates(id) ON DELETE RESTRICT,
    branch_id INTEGER REFERENCES branches(id) ON DELETE RESTRICT,
    processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    method payment_method NOT NULL,
    reference_number VARCHAR(100), -- For GCash/Bank Transfer Trace Numbers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure an estimate can only be paid once
ALTER TABLE payments ADD CONSTRAINT unique_estimate_payment UNIQUE (estimate_id);