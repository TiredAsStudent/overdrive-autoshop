-- 049_create_vendor_payments.sql
-- Purpose: Schema for official Cash Disbursements (Accounts Payable Liquidation)
-- Fixes missing relation errors for Vendor Data Aggregation.

-- 1. Create Payment Method Enum
DO $$ BEGIN
    CREATE TYPE vendor_payment_method_enum AS ENUM ('CASH', 'CHECK', 'BANK_TRANSFER', 'GCASH', 'MAYA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create the Vendor Payments Ledger Table
CREATE TABLE IF NOT EXISTS vendor_payments (
    id SERIAL PRIMARY KEY,
    payment_number VARCHAR(30) UNIQUE NOT NULL, -- Format: VPAY-YYYYMM-XXXX
    vendor_id INT NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    bill_id INT NOT NULL REFERENCES bills(id) ON DELETE RESTRICT,
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    
    amount_paid NUMERIC(10, 2) NOT NULL CHECK (amount_paid > 0.00),
    payment_method vendor_payment_method_enum NOT NULL,
    reference_number VARCHAR(100),
    payment_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update the Bills Table to track paid amounts for outstanding payable math
ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2) DEFAULT 0.00 CHECK (amount_paid >= 0.00);

-- 4. Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor ON vendor_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_bill ON vendor_payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_date ON vendor_payments(payment_date DESC);