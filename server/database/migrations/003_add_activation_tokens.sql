-- 003_add_activation_tokens.sql
ALTER TABLE users
ADD COLUMN activation_token VARCHAR(255),
ADD COLUMN activation_token_expires TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_users_activation_token ON users(activation_token);