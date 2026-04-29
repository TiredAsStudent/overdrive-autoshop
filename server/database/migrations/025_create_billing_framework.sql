-- 025_create_billing_framework.sql

-- Create Transaction Type & Status Enums
CREATE TYPE billing_type AS ENUM ('ESTIMATE', 'SALES_ORDER', 'INVOICE');
CREATE TYPE billing_status AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'PAID', 'CANCELLED');

--  Create the Billing Transactions Table (The Header)
-- This allows the Kanban board to see if an Estimate exists and what its status is.
CREATE TABLE IF NOT EXISTS billing_transactions (
    id SERIAL PRIMARY KEY,
    job_card_id INTEGER REFERENCES job_cards(id) ON DELETE CASCADE,
    branch_id INTEGER REFERENCES branches(id) ON DELETE RESTRICT,
    customer_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
    type billing_type NOT NULL,
    status billing_status DEFAULT 'DRAFT',
    total_amount DECIMAL(12, 2) DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    reference_number VARCHAR(50) UNIQUE, -- e.g., EST-1024 or INV-BAT-505
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

--  Create the Billing Items Table (The Line Items)
-- This is where parts from OCR or Service Packages get "claimed" by a Job Card.
CREATE TABLE IF NOT EXISTS billing_items (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES billing_transactions(id) ON DELETE CASCADE,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL, -- Null if it's just a labor fee
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_cost DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    is_labor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add Indexes for the Kanban Board's "Badge" logic
CREATE INDEX idx_billing_job_card ON billing_transactions(job_card_id);
CREATE INDEX idx_billing_status ON billing_transactions(status);