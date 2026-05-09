-- 010_update_expenses_rejection.sql

-- 1. Add the new columns to the existing expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS rejection_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS parent_expense_id INT REFERENCES expenses(id) ON DELETE SET NULL;

-- 2. Add an index to speed up queries when finding the "Parent" of a resubmission
CREATE INDEX IF NOT EXISTS idx_expenses_parent_id ON expenses(parent_expense_id);