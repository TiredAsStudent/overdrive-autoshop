-- 042_add_chart_of_accounts_indexes.sql

-- Migration: Add B-Tree Indexes for Chart of Accounts
CREATE INDEX IF NOT EXISTS idx_coa_account_code ON chart_of_accounts(account_code);
CREATE INDEX IF NOT EXISTS idx_coa_account_type ON chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_coa_is_active ON chart_of_accounts(is_active);