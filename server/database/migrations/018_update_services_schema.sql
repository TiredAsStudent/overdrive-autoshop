-- 018_update_services_schema.sql
-- Purpose: Fix the data type mismatch for commonly_used_parts to properly map to the inventory_items Integer IDs.

ALTER TABLE services DROP COLUMN commonly_used_parts;
ALTER TABLE services ADD COLUMN commonly_used_parts INT[] DEFAULT '{}';

-- Documentation
COMMENT ON COLUMN services.commonly_used_parts IS 'Stores an array of inventory_items IDs (Integers)';