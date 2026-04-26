-- 028_add_time_tracking_to_job_cards.sql

-- Add timestamps to track mechanic productivity and bay efficiency
ALTER TABLE job_cards 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create an index to speed up performance queries for the Manager dashboard
CREATE INDEX IF NOT EXISTS idx_job_cards_completion_time ON job_cards(completed_at);