-- 059_refactor_expenses_to_coa.sql
-- Purpose: Replaces fragile string-based expense categories with strict relational COA mapping.
-- Ensures historical expenses remain linked even if a Manager renames an account.

BEGIN;

-- 1. Add the relational foreign key
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS expense_account_id INT REFERENCES chart_of_accounts(id) ON DELETE RESTRICT;

-- 2. Migrate existing text categories to relational IDs
UPDATE expenses e
SET expense_account_id = (
    SELECT id 
    FROM chart_of_accounts c 
    WHERE c.account_name ILIKE e.category 
    LIMIT 1
);

-- 3. Fallback for unmatched/orphaned categories (Map to 5999 'Uncategorized Expense')
UPDATE expenses 
SET expense_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '5999' LIMIT 1) 
WHERE expense_account_id IS NULL;

-- 4. Enforce NOT NULL and drop the obsolete string column
ALTER TABLE expenses ALTER COLUMN expense_account_id SET NOT NULL;
ALTER TABLE expenses DROP COLUMN IF EXISTS category;

-- 5. Build high-performance index for Ledger queries
CREATE INDEX IF NOT EXISTS idx_expenses_account_id ON expenses(expense_account_id);
DROP INDEX IF EXISTS idx_expenses_category;

COMMIT;