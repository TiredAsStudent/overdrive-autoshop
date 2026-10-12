-- 054_add_missing_expense_accounts.sql
-- Purpose: Adds the missing operational expense categories to the Chart of Accounts
-- so that OCR Receipt approvals correctly map to the General Ledger.

INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_system, is_vat_applicable, description) VALUES
('5040', 'Rent Expense', 'EXPENSE', FALSE, TRUE, 'Shop or office rental expenses'),
('5050', 'Transportation Expense', 'EXPENSE', FALSE, TRUE, 'Travel and transportation costs'),
('5060', 'Meals & Entertainment', 'EXPENSE', FALSE, TRUE, 'Business meals and representation'),
('5070', 'Office Supplies', 'EXPENSE', FALSE, TRUE, 'Office supplies and consumables')
ON CONFLICT (account_code) DO NOTHING;