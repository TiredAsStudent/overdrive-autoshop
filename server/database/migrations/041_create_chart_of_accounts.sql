-- 041_create_chart_of_accounts.sql
-- Purpose: Master Financial Directory for Overdrive Auto Shop (Excluding GL/Journal Entries)

DO $$ BEGIN
    CREATE TYPE account_type_enum AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id SERIAL PRIMARY KEY,
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(150) NOT NULL,
    account_type account_type_enum NOT NULL,
    parent_id INT REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    description TEXT,
    is_vat_applicable BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE, -- Protects critical operational accounts from deletion
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coa_code ON chart_of_accounts(account_code);
CREATE INDEX idx_coa_type ON chart_of_accounts(account_type);
CREATE INDEX idx_coa_active ON chart_of_accounts(is_active);

-- Seed Standard Automotive Accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_system, is_vat_applicable, description) VALUES
-- ASSETS (1000s)
('1010', 'Cash on Hand', 'ASSET', TRUE, FALSE, 'Physical cash available in branches'),
('1020', 'Input VAT', 'ASSET', TRUE, FALSE, 'VAT claims from vendor purchases'),
('1100', 'Spare Parts Inventory', 'ASSET', TRUE, FALSE, 'Asset value of physical parts in stock'),

-- LIABILITIES (2000s)
('2010', 'Accounts Payable', 'LIABILITY', TRUE, FALSE, 'Outstanding supplier bills'),
('2020', 'Output VAT', 'LIABILITY', TRUE, FALSE, 'VAT collected from customer sales'),

-- EQUITY (3000s)
('3010', 'Owner''s Equity', 'EQUITY', TRUE, FALSE, 'Capital invested by the owner'),

-- INCOME / REVENUE (4000s)
('4010', 'Automotive Repair Revenue', 'INCOME', TRUE, TRUE, 'Revenue from mechanical and repair services'),
('4020', 'Parts Sales Revenue', 'INCOME', TRUE, TRUE, 'Revenue from over-the-counter parts sales'),

-- EXPENSES (5000s)
('5010', 'Parts & Supplies Expense', 'EXPENSE', TRUE, TRUE, 'Cost of direct materials and shop supplies'),
('5020', 'Utility Expense', 'EXPENSE', FALSE, TRUE, 'Electricity, water, and internet bills'),
('5030', 'Equipment Maintenance', 'EXPENSE', FALSE, TRUE, 'Repairs to shop tools and lifts'),
('5999', 'Uncategorized Expense', 'EXPENSE', TRUE, FALSE, 'Fallback account for automated system postings')
ON CONFLICT (account_code) DO NOTHING;