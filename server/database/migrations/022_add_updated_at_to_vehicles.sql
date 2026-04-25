-- 022_add_updated_at_to_vehicles.sql

-- Add the updated_at column to the vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Optional: Update existing rows to have the current timestamp
UPDATE vehicles SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;