-- 047_add_vendor_procurement_indexes.sql
-- Purpose: Optimizes correlated subqueries for the Vendor Procurement Ledger to prevent sequential table scans.

CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bills_vendor ON bills(vendor_id);

-- Documentation
COMMENT ON INDEX idx_purchase_orders_vendor IS 'Accelerates PO counts and metrics on the Vendors directory.';
COMMENT ON INDEX idx_bills_vendor IS 'Accelerates Bill counts and procurement value calculations on the Vendors directory.';