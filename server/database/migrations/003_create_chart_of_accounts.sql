-- 003_create_chart_of_accounts.sql

CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id SERIAL PRIMARY KEY,
    account_code VARCHAR(10) UNIQUE NOT NULL, 
    account_name VARCHAR(100) NOT NULL,       
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
    description TEXT,
    is_system_protected BOOLEAN DEFAULT FALSE, 
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed Initial System-Required Accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_system_protected, description)
VALUES 
('1000', 'Cash-on-Hand', 'Asset', TRUE, 'Primary physical cash and digital wallet balance'),
('1200', 'Inventory Assets', 'Asset', TRUE, 'Total value of parts currently on shelves'),
('2000', 'Accounts Payable', 'Liability', TRUE, 'Money owed to suppliers for parts/services'),
('2100', 'Output VAT Payable', 'Liability', TRUE, '12% Tax collected from customer sales'),
('4000', 'Labor Revenue', 'Revenue', TRUE, 'Income generated from mechanic services'),
('5000', 'Cost of Goods Sold (COGS)', 'Expense', TRUE, 'Direct cost of parts used in repairs'),
('5100', 'Salaries & Wages', 'Expense', TRUE, 'Labor costs for shop employees'),
('5200', 'Shop Utilities', 'Expense', FALSE, 'Electricity, Water, and Internet costs')
ON CONFLICT (account_code) DO NOTHING;