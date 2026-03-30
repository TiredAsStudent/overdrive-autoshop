-- Migration: 014_expense_ledger
-- Description: Creates the Maker-Checker tables for OCR Expenses

-- The Maker-Checker Status ENUM
DO $$ BEGIN
    CREATE TYPE expense_status_enum AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- The Simplified Chart of Accounts (COA) Categories
CREATE TABLE IF NOT EXISTS expense_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'Inventory Parts', 'Shop Utilities'
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert the default "Simplified COA" for the front desk
INSERT INTO expense_categories (name, description) VALUES 
('Inventory Parts', 'Parts purchased to restock the local shelves'),
('Shop Utilities', 'Electricity, Water, Internet bills'),
('Office Supplies', 'Paper, ink, general front-desk supplies'),
('Rent', 'Monthly garage rent')
ON CONFLICT DO NOTHING;

-- The Expense Master Table (The Waiting Room)
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE RESTRICT,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES expense_categories(id) ON DELETE RESTRICT,
    vendor_name VARCHAR(255) NOT NULL,
    receipt_date DATE NOT NULL,
    invoice_number VARCHAR(100),
    total_amount NUMERIC(10, 2) NOT NULL,
    status expense_status_enum DEFAULT 'PENDING_APPROVAL',
    receipt_image_url TEXT, -- Path to the uploaded photo for Side-by-Side review
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- The Expense Detail Table (The OCR Line Items)
CREATE TABLE IF NOT EXISTS expense_line_items (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_cost NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);