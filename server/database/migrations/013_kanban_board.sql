-- Migration: 013_kanban_board
-- Description: Adds garage status and mechanic tracking for the WIP Kanban board

-- The Garage Status ENUM (For the 3 columns)
DO $$ BEGIN
    CREATE TYPE garage_status_enum AS ENUM ('PENDING', 'ONGOING', 'DONE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Upgrade the Estimates Table
ALTER TABLE estimates 
ADD COLUMN IF NOT EXISTS garage_status garage_status_enum DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS mechanic_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Create an index to make Kanban loading blazing fast (since it filters by WIP)
CREATE INDEX IF NOT EXISTS idx_estimates_wip_garage 
ON estimates(branch_id, status, garage_status) 
WHERE status = 'WIP';