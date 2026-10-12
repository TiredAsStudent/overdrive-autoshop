-- 048_add_po_resolution_tracking.sql
-- Purpose: Adds required FRS compliance tracking for PO managerial decisions.

ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS resolved_by INT REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Documentation
COMMENT ON COLUMN purchase_orders.resolved_by IS 'Captures the ID of the Manager/Admin who Approved or Rejected the PO.';
COMMENT ON COLUMN purchase_orders.resolved_at IS 'Immutable timestamp of the exact moment the decision was rendered.';