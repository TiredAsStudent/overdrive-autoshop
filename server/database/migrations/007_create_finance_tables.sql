-- 007_create_finance_tables.sql

CREATE TYPE account_type AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE ledger_transaction_type AS ENUM ('DEBIT', 'CREDIT');

CREATE TABLE IF NOT EXISTS account_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type account_type NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_ledger (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE RESTRICT,
    account_category_id INTEGER REFERENCES account_categories(id) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    transaction_type ledger_transaction_type NOT NULL,
    reference_type VARCHAR(50) NOT NULL, 
    reference_id INTEGER NOT NULL,       
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_account_categories_type_active ON account_categories(type, is_active);
CREATE INDEX idx_financial_ledger_branch_category ON financial_ledger(branch_id, account_category_id);