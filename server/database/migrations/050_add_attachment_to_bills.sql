-- 050_add_attachment_to_bills.sql
-- Purpose: Adds documentary proof tracking (Official Receipts/Vendor Invoices) to the Accounts Payable registry.

ALTER TABLE bills
ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500);

-- Documentation
COMMENT ON COLUMN bills.attachment_url IS 'Relative path to the uploaded vendor bill, delivery receipt, or Official Receipt (PDF/Image).';