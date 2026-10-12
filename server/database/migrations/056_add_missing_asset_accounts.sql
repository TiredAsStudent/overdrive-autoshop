-- 056_add_missing_asset_accounts.sql
-- Purpose: Seeds the missing core asset accounts required by the Account Usage Engine
-- 1030: Cash in Bank / E-Wallets (Digital Payments)
-- 1040: Accounts Receivable (Unpaid Invoices)

INSERT INTO chart_of_accounts (
    account_code, 
    account_name, 
    account_type, 
    is_system, 
    is_vat_applicable, 
    description
) VALUES
('1030', 'Cash in Bank / E-Wallets', 'ASSET', TRUE, FALSE, 'Digital payments received via Bank Transfer, GCash, and Maya'),
('1040', 'Accounts Receivable', 'ASSET', TRUE, FALSE, 'Outstanding balances from unpaid or partially paid customer invoices')
ON CONFLICT (account_code) DO NOTHING;