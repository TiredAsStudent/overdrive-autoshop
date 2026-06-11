-- 001_init.sql
-- Drop existing types if resetting
DROP TYPE IF EXISTS user_role CASCADE;

-- Create Enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'STAFF');

-- 1. Branches 
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    branch_code VARCHAR(10) UNIQUE NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_maintenance_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role user_role NOT NULL,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    google_id VARCHAR(255) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT FALSE,
    token_version INT DEFAULT 1,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    activation_token VARCHAR(255),
    activation_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. System Settings
CREATE TABLE system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    company_name VARCHAR(150) DEFAULT 'Overdrive Auto Shop',
    vat_percentage NUMERIC(5,2) DEFAULT 12.00,
    markup_percentage NUMERIC(5,2) DEFAULT 20.00,
    contact_email VARCHAR(100),
    contact_number VARCHAR(50),
    logo_url VARCHAR(255),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'INFO',
    target_resource VARCHAR(100),
    target_id INT,
    ip_address VARCHAR(45),
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);