-- 017_update_finance_tables.sql

-- CLEANUP OLD STRUCTURES
DROP TABLE IF EXISTS financial_ledger CASCADE;
DROP TABLE IF EXISTS account_balances CASCADE;
DROP TABLE IF EXISTS chart_of_accounts CASCADE;
DROP TABLE IF EXISTS account_categories CASCADE;
DROP TYPE IF EXISTS ledger_transaction_type CASCADE;
DROP TYPE IF EXISTS account_type CASCADE;

-- CREATE NEW ENTERPRISE STRUCTURES
-- The 5 Standard Accounting Categories (The Mother Buckets)
CREATE TABLE IF NOT EXISTS account_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE, -- 'Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses'
    code_range_start INTEGER NOT NULL,
    code_range_end INTEGER NOT NULL
);

-- The Chart of Accounts (The Mapping Bridge)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES account_categories(id) ON DELETE RESTRICT,
    account_code INTEGER UNIQUE NOT NULL,       -- e.g., 5100
    account_name VARCHAR(100) NOT NULL,         -- e.g., 'Utilities Expense' (Technical)
    staff_label VARCHAR(100) NOT NULL,          -- e.g., 'Electricity/Water' (User-Friendly)
    is_active BOOLEAN DEFAULT TRUE,
    is_system_locked BOOLEAN DEFAULT FALSE,     -- TRUE for accounts like "Cash" that shouldn't be deleted
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Multi-Branch Running Balances
CREATE TABLE IF NOT EXISTS account_balances (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
    branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, branch_id)
);

-- The General Ledger (For individual transactions)
CREATE TYPE ledger_transaction_type AS ENUM ('DEBIT', 'CREDIT');

CREATE TABLE IF NOT EXISTS financial_ledger (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE RESTRICT,
    account_id INTEGER REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    transaction_type ledger_transaction_type NOT NULL,
    reference_type VARCHAR(50) NOT NULL, -- e.g., 'INVOICE', 'OCR_RECEIPT'
    reference_id INTEGER NOT NULL,       
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


--  SEED INITIAL DATA
INSERT INTO account_categories (category_name, code_range_start, code_range_end) VALUES
('Assets', 1000, 1999),
('Liabilities', 2000, 2999),
('Equity', 3000, 3999),
('Revenue', 4000, 4999),
('Expenses', 5000, 5999)
ON CONFLICT DO NOTHING;