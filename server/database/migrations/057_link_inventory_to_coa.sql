-- 057_link_inventory_to_coa.sql
-- Purpose: Adds dynamic Chart of Accounts mappings (Asset, Income, Expense) to the Master Inventory.
-- Restores double-entry integrity for shrinkage and eliminates hardcoded ledger queries.

ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS asset_account_id INT REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS income_account_id INT REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS expense_account_id INT REFERENCES chart_of_accounts(id) ON DELETE RESTRICT;

-- Safely backfill existing operational items to the system defaults
UPDATE inventory_items
SET asset_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1100' LIMIT 1),
    income_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '4020' LIMIT 1),
    expense_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '5010' LIMIT 1)
WHERE asset_account_id IS NULL;

-- High-performance indexes for the Accounting Engine
CREATE INDEX IF NOT EXISTS idx_inventory_asset_acc ON inventory_items(asset_account_id);
CREATE INDEX IF NOT EXISTS idx_inventory_income_acc ON inventory_items(income_account_id);
CREATE INDEX IF NOT EXISTS idx_inventory_expense_acc ON inventory_items(expense_account_id);