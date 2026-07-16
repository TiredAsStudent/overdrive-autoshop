-- 026_create_payments.sql
-- Purpose: Schema for official cash collection and accounts receivable liquidation.

-- 1. Create Payment Method Enum (VR-06)
DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('CASH', 'GCASH', 'MAYA', 'BANK_TRANSFER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create the Payments Ledger Table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    payment_number VARCHAR(30) UNIQUE NOT NULL, -- Format: PAY-YYYYMM-XXXX
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT, -- BR-01 Compliance
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,  -- BR-09 Compliance
    
    amount_received NUMERIC(10, 2) NOT NULL CHECK (amount_received > 0.00), -- VR-03 Enforced
    payment_method payment_method_enum NOT NULL,
    reference_number VARCHAR(100), -- VR-07 (Digital methods only via API constraint)
    notes TEXT,
    
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Optimization Indexes for High-Speed Financial Reporting
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_branch_date ON payments(branch_id, created_at DESC);
CREATE INDEX idx_payments_method ON payments(payment_method);