-- 019_update_user_tables.sql
-- Adds the token_version column for the Session Kill-Switch feature

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1;

-- Ensure existing users have a default value
UPDATE users SET token_version = 1 WHERE token_version IS NULL;