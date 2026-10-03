-- 061_add_frs_expense_reporting_indexes.sql
-- Purpose: Highly optimized composite indexes to accelerate the unified Expense Reports CTE query.

-- 1. Index for Manual Expenses and OCR Receipts
-- Accelerates: WHERE status = 'APPROVED' AND branch_id = $1 AND expense_date >= $2
CREATE INDEX IF NOT EXISTS idx_frs_expenses_reporting 
ON expenses(status, branch_id, expense_date) 
WHERE status = 'APPROVED';

-- 2. Index for Supplier Bills
-- Accelerates: WHERE status IN ('RECEIVED', 'CLOSED') AND branch_id = $1 AND bill_date >= $2
CREATE INDEX IF NOT EXISTS idx_frs_bills_reporting 
ON bills(status, branch_id, bill_date) 
WHERE status IN ('RECEIVED', 'CLOSED');

-- 3. Index for Journal Entries
-- Accelerates: WHERE status = 'POSTED' AND branch_id = $1 AND entry_date >= $2
CREATE INDEX IF NOT EXISTS idx_frs_journals_reporting 
ON journal_entries(status, branch_id, entry_date) 
WHERE status = 'POSTED';

-- Documentation
COMMENT ON INDEX idx_frs_expenses_reporting IS 'Accelerates the Unified FRS Expense Reports CTE';
COMMENT ON INDEX idx_frs_bills_reporting IS 'Accelerates the Unified FRS Expense Reports CTE for supplier inventory mapping';
COMMENT ON INDEX idx_frs_journals_reporting IS 'Accelerates the Unified FRS Expense Reports CTE for manual adjustments';