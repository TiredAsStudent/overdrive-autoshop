-- 018_update_services_tables.sql

-- Adds the missing link to your Chart of Accounts
ALTER TABLE services 
ADD COLUMN revenue_account_id INTEGER REFERENCES chart_of_accounts(id) ON DELETE RESTRICT;

-- Index for faster financial reporting later
CREATE INDEX idx_services_revenue_account ON services(revenue_account_id);