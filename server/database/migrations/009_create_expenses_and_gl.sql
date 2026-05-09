-- 009_create_expenses_and_gl.sql

-- 1. Create Suppliers Table (For Auto-Mapping)
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    tin VARCHAR(50),
    contact_info VARCHAR(100),
    is_vat_registered BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create Expenses Table (The Waiting Room for OCR Data)
CREATE TYPE expense_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL, -- Nullable for Payroll
    submitted_by INT NOT NULL REFERENCES users(id),
    
    transaction_date DATE NOT NULL,
    base_amount NUMERIC(12, 2) DEFAULT 0.00,
    vat_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) DEFAULT 0.00,
    
    receipt_image_url TEXT NOT NULL, -- For the Split-Screen UI
    ai_confidence_score NUMERIC(3, 2), -- To trigger yellow/red UI warnings
    
    status expense_status DEFAULT 'PENDING',
    rejection_reason TEXT, -- Populated if Manager rejects
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create Expense Line Items (For Part-by-Part Extraction & Moving Average)
CREATE TABLE IF NOT EXISTS expense_items (
    id SERIAL PRIMARY KEY,
    expense_id INT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    inventory_item_id INT REFERENCES inventory_items(id), -- Maps to Master Catalog
    description VARCHAR(255),
    quantity INT DEFAULT 1,
    unit_price NUMERIC(10, 2) DEFAULT 0.00,
    total_price NUMERIC(12, 2) DEFAULT 0.00
);

-- 4. Create The General Ledger (The Ultimate Source of Truth)
CREATE TABLE IF NOT EXISTS general_ledger (
    id SERIAL PRIMARY KEY,
    branch_id INT NOT NULL REFERENCES branches(id),
    transaction_date DATE NOT NULL,
    account_id INT NOT NULL REFERENCES chart_of_accounts(id),
    
    debit NUMERIC(12, 2) DEFAULT 0.00,
    credit NUMERIC(12, 2) DEFAULT 0.00,
    
    reference_type VARCHAR(50), -- e.g., 'EXPENSE_RECEIPT', 'SALES_INVOICE'
    reference_id INT NOT NULL,
    description TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for lightning-fast reports
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_gl_account_branch ON general_ledger(account_id, branch_id);