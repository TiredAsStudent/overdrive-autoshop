-- 033_fix_invoice_unique_constraint.sql
-- Purpose: Fixes the 409 conflict so staff can re-bill a Sales Order if the original invoice was VOIDED.

-- 1. Drop the original rigid table constraint that causes the 409 error
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_sales_order_id_key;

-- 2. Create a Partial Unique Index using the exact same name 
-- This allows multiple invoices for the same Sales Order ONLY if the previous ones are VOID.
CREATE UNIQUE INDEX invoices_sales_order_id_key 
ON invoices(sales_order_id) 
WHERE status != 'VOID';