-- 002_add_reset_tokens.sql

-- Add columns for secure password resets
ALTER TABLE users
ADD COLUMN reset_token VARCHAR(255),
ADD COLUMN reset_token_expires TIMESTAMP WITH TIME ZONE;

-- Create an index to make token lookups lightning fast
CREATE INDEX idx_users_reset_token ON users(reset_token);