-- 058_add_system_account_mappings.sql
-- Purpose: Elevates the Chart of Accounts to a fully relational, dynamic structure
-- by storing FRS control account references in system_settings instead of hardcoding string codes.

ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS ap_account_id INT REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS ar_account_id INT REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS input_vat_account_id INT REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS output_vat_account_id INT REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS cash_on_hand_account_id INT REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS digital_payment_account_id INT REFERENCES chart_of_accounts(id) ON DELETE RESTRICT;

-- Backfill existing data mapping from seeded COA codes securely
UPDATE system_settings
SET 
    ap_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '2010' LIMIT 1),
    ar_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1040' LIMIT 1),
    input_vat_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1020' LIMIT 1),
    output_vat_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '2020' LIMIT 1),
    cash_on_hand_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1010' LIMIT 1),
    digital_payment_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1030' LIMIT 1)
WHERE id = 1;