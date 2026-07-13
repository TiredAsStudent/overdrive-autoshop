-- 019_add_adjustment_tracking.sql
-- Purpose: Enforce strict reason codes and historical cost tracking for manual stock adjustments.

-- 1. Create standardized reason codes for accounting mapping
DO $$ BEGIN
    CREATE TYPE adjustment_reason_enum AS ENUM (
        'DAMAGED', 
        'STOLEN_OR_LOST', 
        'STOCK_COUNT_RECONCILIATION', 
        'CLERICAL_ERROR', 
        'PROMOTIONAL_GIVEAWAY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Enhance the movements ledger
ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS adjustment_reason adjustment_reason_enum,
ADD COLUMN IF NOT EXISTS recorded_unit_cost NUMERIC(10, 2);

-- Documentation
COMMENT ON COLUMN inventory_movements.recorded_unit_cost IS 'Captures the item unit_cost at the exact moment of adjustment for historical financial reporting.';
COMMENT ON COLUMN inventory_movements.adjustment_reason IS 'Categorizes the adjustment for integration with the General Ledger / Expense accounts.';