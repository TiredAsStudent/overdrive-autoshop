-- 008_create_vat_ledger.sql

-- 1. Create Tax-Specific Enums
CREATE TYPE vat_transaction_type AS ENUM ('INPUT', 'OUTPUT');
CREATE TYPE vat_category AS ENUM ('VATABLE', 'ZERO_RATED', 'EXEMPT');
CREATE TYPE vat_reference_type AS ENUM ('SALES_INVOICE', 'SUPPLIER_RECEIPT', 'MANUAL_ADJUSTMENT');

-- 2. Create the VAT Ledger Table
CREATE TABLE IF NOT EXISTS vat_ledger (
    id SERIAL PRIMARY KEY,
    transaction_date DATE NOT NULL,
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    
    transaction_type vat_transaction_type NOT NULL, -- INPUT (Purchases) or OUTPUT (Sales)
    vat_category vat_category DEFAULT 'VATABLE',    -- Handles non-VAT suppliers
    
    base_amount NUMERIC(12, 2) DEFAULT 0.00 CHECK (base_amount >= 0),
    vat_amount NUMERIC(12, 2) DEFAULT 0.00 CHECK (vat_amount >= 0),
    total_amount NUMERIC(12, 2) DEFAULT 0.00 CHECK (total_amount >= 0),
    
    reference_type vat_reference_type NOT NULL, 
    reference_id INT NOT NULL, -- Will link to the future invoices/receipts table
    
    tax_period VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM' (e.g., '2026-05')
    is_closed BOOLEAN DEFAULT FALSE, -- The Immutable Lock
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexing for fast financial reporting across massive datasets
CREATE INDEX idx_vat_tax_period ON vat_ledger(tax_period);
CREATE INDEX idx_vat_branch ON vat_ledger(branch_id);