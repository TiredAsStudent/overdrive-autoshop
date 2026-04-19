-- 016_update_mechanics_table.sql

-- Add the new enterprise columns
ALTER TABLE mechanics 
ADD COLUMN certification_level VARCHAR(50) DEFAULT 'Junior',
ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';

-- Migrate existing data (converts old booleans to new status strings)
UPDATE mechanics SET status = 'ACTIVE' WHERE is_active = TRUE;
UPDATE mechanics SET status = 'TERMINATED' WHERE is_active = FALSE;

-- Drop the old boolean column now that data is migrated
ALTER TABLE mechanics DROP COLUMN is_active;

-- Rebuild the High-Performance Indexes
-- Drop the old active-based index first
DROP INDEX IF EXISTS idx_mechanics_branch_active;

-- Create the new status-based index
CREATE INDEX IF NOT EXISTS idx_mechanics_branch_status ON mechanics(branch_id, status);

-- Ensure the name index exists (use IF NOT EXISTS so it doesn't crash if you already made it)
CREATE INDEX IF NOT EXISTS idx_mechanics_name ON mechanics(last_name, first_name);