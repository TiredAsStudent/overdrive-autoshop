-- 032_add_completed_at_to_sales_orders.sql
-- Purpose: Adds an immutable timestamp for when a service job officially finishes.

ALTER TABLE sales_orders
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP DEFAULT NULL;

-- Documentation
COMMENT ON COLUMN sales_orders.completed_at IS 'Captures the exact moment the workshop marks the job as COMPLETED, independent of future updates.';