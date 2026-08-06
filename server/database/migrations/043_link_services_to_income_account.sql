-- 043_link_services_to_income_account.sql
-- Purpose: Links the Service Catalog directly to the Chart of Accounts (Income Accounts only)

ALTER TABLE services
ADD COLUMN IF NOT EXISTS income_account_id INT REFERENCES chart_of_accounts(id) ON DELETE RESTRICT;

-- Auto-map existing services to the default Automotive Repair Revenue account (4010)
UPDATE services
SET income_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '4010' LIMIT 1)
WHERE income_account_id IS NULL;

-- Create an index for faster financial query joins
CREATE INDEX IF NOT EXISTS idx_services_income_account ON services(income_account_id);