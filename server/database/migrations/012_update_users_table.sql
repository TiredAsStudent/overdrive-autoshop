-- 012_update_users_table.sql

-- Adds the MANAGER role to your existing ENUM type
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'MANAGER' AFTER 'ADMIN';