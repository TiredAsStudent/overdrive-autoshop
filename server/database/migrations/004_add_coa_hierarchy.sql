-- 004_add_coa_hierarchy.sql

--  Add the new column with the self-referencing safety rule
ALTER TABLE chart_of_accounts 
ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES chart_of_accounts(id) ON DELETE RESTRICT;

--  Update the existing "Shop Utilities" description to reflect it is now a Parent
UPDATE chart_of_accounts 
SET description = 'Parent account for shop operational utilities'
WHERE account_code = '5200';

--  Seed an example Sub-Account (Electricity linked to Utilities)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description, parent_id)
VALUES (
    '5201', 
    'Electricity', 
    'Expense', 
    'Meralco monthly billing', 
    (SELECT id FROM chart_of_accounts WHERE account_code = '5200')
)
ON CONFLICT (account_code) DO NOTHING;