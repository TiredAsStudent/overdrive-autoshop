-- 022_create_customers.sql
-- Purpose: Centralized CRM table for the Sales Module

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    customer_code VARCHAR(30) UNIQUE NOT NULL, -- Format: CUST-YYYYMM-XXXX
    full_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    branch_id INT REFERENCES branches(id) ON DELETE RESTRICT, -- Branch where they first registered
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Optimization Indexes for rapid Point-of-Sale searching
CREATE INDEX idx_customers_search ON customers(full_name, contact_number);
CREATE INDEX idx_customers_branch ON customers(branch_id);