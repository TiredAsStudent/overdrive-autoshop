-- 055_add_ocr_receipt_partial_indexes.sql
-- Purpose: Highly optimized partial indexes for the Manager Receipt Approvals Inbox.
-- This ensures that standard manual expenses do not slow down the OCR approval queue queries as the database scales.

-- 1. Index for the Pending Approvals Inbox
CREATE INDEX IF NOT EXISTS idx_expenses_ocr_pending 
ON expenses(branch_id, created_at DESC) 
WHERE scan_id IS NOT NULL AND status = 'PENDING_APPROVAL';

-- 2. Index for the Approval History / Archive
CREATE INDEX IF NOT EXISTS idx_expenses_ocr_history 
ON expenses(branch_id, resolved_at DESC) 
WHERE scan_id IS NOT NULL AND status IN ('APPROVED', 'REJECTED');

-- Documentation
COMMENT ON INDEX idx_expenses_ocr_pending IS 'Accelerates the Manager Receipt Approvals pending queue by ignoring all manual expenses.';
COMMENT ON INDEX idx_expenses_ocr_history IS 'Accelerates the Manager Receipt Approvals historical ledger by ignoring all manual expenses.';