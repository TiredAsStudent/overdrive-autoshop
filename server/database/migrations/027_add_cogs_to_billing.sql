-- 027_add_cogs_to_billing.sql

--  Add COGS tracking to line items
ALTER TABLE billing_items 
ADD COLUMN IF NOT EXISTS base_cost DECIMAL(12, 2) DEFAULT 0.00;

--  Add Payment Traceability to the main transactions table
ALTER TABLE billing_transactions
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS amount_tendered DECIMAL(12, 2) DEFAULT 0.00;

-- Optional: Update existing records to match unit_cost (if any exist)
UPDATE billing_items SET base_cost = unit_cost WHERE base_cost = 0.00 AND is_labor = FALSE;