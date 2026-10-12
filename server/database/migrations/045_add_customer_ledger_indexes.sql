-- 045_add_customer_ledger_indexes.sql
-- Purpose: Optimizes the FRS 5.8 360° Customer Transaction Ledger query.
-- Prevents sequential scans when aggregating historical data for the Customer Profile Drawer.

-- 1. Index for Sales Orders Ledger Lookup
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer 
ON sales_orders(customer_id);

-- 2. Index for Invoices Ledger Lookup
CREATE INDEX IF NOT EXISTS idx_invoices_customer 
ON invoices(customer_id);

-- 3. Ensure Payments are indexed by invoice for rapid JOINs
-- (This already existed in 026, but adding IF NOT EXISTS as a failsafe)
CREATE INDEX IF NOT EXISTS idx_payments_invoice 
ON payments(invoice_id);

-- Documentation
COMMENT ON INDEX idx_sales_orders_customer IS 'Accelerates the Customer Profile UNION ALL ledger query';
COMMENT ON INDEX idx_invoices_customer IS 'Accelerates the Customer Profile UNION ALL ledger query';