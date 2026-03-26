-- Migration: 004_finance_config
-- Description: Creates the Chart of Accounts (COA) and Global Tax/Markup Settings

-- Create the Account Categories ENUM Safely
DO $$ 
BEGIN
    CREATE TYPE account_category AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the Chart of Accounts Table
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id SERIAL PRIMARY KEY,
    account_name VARCHAR(100) NOT NULL UNIQUE,
    category account_category NOT NULL,
    description TEXT,
    running_balance NUMERIC(12, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the Global Settings Table (Key-Value Store)
CREATE TABLE IF NOT EXISTS global_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value NUMERIC(10, 2) NOT NULL,
    description TEXT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);