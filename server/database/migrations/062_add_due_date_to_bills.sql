-- 062_add_due_date_to_bills.sql
-- Purpose: Adds the missing due_date column to the bills table, which is strictly required 
-- for the Accounts Payable (AP) Aging Engine.

BEGIN;

-- 1. Add the column allowing NULLs temporarily
ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS due_date DATE;

-- 2. Backfill existing bills with a standard 30-day supplier term based on the bill_date
UPDATE bills 
SET due_date = bill_date + INTERVAL '30 days' 
WHERE due_date IS NULL;

-- 3. Enforce NOT NULL constraint for all future bills
ALTER TABLE bills 
ALTER COLUMN due_date SET NOT NULL;

-- 4. Add performance index for Aging Report queries
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);

COMMIT;