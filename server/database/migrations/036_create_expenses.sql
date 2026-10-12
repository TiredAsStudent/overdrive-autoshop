-- 036_create_expenses.sql
-- Purpose: Schema for Manual Operational Expenses (OpEx)

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE expense_status_enum AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');
    CREATE TYPE expense_payment_method_enum AS ENUM ('CASH', 'PETTY_CASH', 'GCASH', 'MAYA', 'BANK_TRANSFER', 'CHECK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    expense_number VARCHAR(30) UNIQUE NOT NULL, -- Format: EXP-YYYYMM-XXXX
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    vendor_id INT REFERENCES vendors(id) ON DELETE RESTRICT,
    
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    reference_number VARCHAR(100),
    expense_date DATE NOT NULL,
    
    is_vatable BOOLEAN DEFAULT TRUE,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0.00),
    vat_amount NUMERIC(10, 2) NOT NULL CHECK (vat_amount >= 0.00),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount > 0.00),
    
    payment_method expense_payment_method_enum DEFAULT 'CASH',
    status expense_status_enum DEFAULT 'DRAFT',
    
    notes TEXT,
    rejection_remarks TEXT,
    
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    resolved_by INT REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Prevent duplicate reference numbers for the same vendor in the same branch (Ignores NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_expense_ref 
ON expenses(branch_id, vendor_id, reference_number) 
WHERE reference_number IS NOT NULL AND vendor_id IS NOT NULL;

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_branch_status ON expenses(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);