-- 026_update_billing_for_estimates.sql

-- Add the expiry column for Estimates
ALTER TABLE billing_transactions 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create an index to quickly find expired estimates
CREATE INDEX IF NOT EXISTS idx_billing_expires_at ON billing_transactions(expires_at);