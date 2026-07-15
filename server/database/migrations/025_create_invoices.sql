-- 025_create_invoices.sql
-- Purpose: Schema for official financial billing documents (Posting Transactions)

-- 1. Create Status Enum
DO $$ BEGIN
    CREATE TYPE invoice_payment_status_enum AS ENUM (
        'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Parent Document Table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(30) UNIQUE NOT NULL, -- Format: INV-YYYYMM-XXXX
    sales_order_id INT UNIQUE NOT NULL REFERENCES sales_orders(id) ON DELETE RESTRICT, -- VR-03 Compliance
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    
    -- Financial Architecture
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    total_discount NUMERIC(10, 2) NOT NULL CHECK (total_discount >= 0),
    vat_amount NUMERIC(10, 2) NOT NULL CHECK (vat_amount >= 0),
    grand_total NUMERIC(10, 2) NOT NULL CHECK (grand_total >= 0),
    amount_paid NUMERIC(10, 2) DEFAULT 0.00 CHECK (amount_paid >= 0),
    
    status invoice_payment_status_enum DEFAULT 'UNPAID',
    due_date DATE NOT NULL,
    notes TEXT,
    
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- VR-08: Due date cannot be strictly enforced as >= created_at at DB level easily 
    -- without timezone complexions, so we rely on API validation for date math.
    CONSTRAINT check_payments CHECK (amount_paid <= grand_total)
);

-- 3. Child Item Snapshot Layout
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INT REFERENCES invoices(id) ON DELETE CASCADE,
    line_type estimate_line_type NOT NULL, -- Reuses SERVICE / PART Enum
    
    service_id INT REFERENCES services(id) ON DELETE RESTRICT,
    item_id INT REFERENCES inventory_items(id) ON DELETE RESTRICT,
    
    quantity INT NOT NULL CHECK (quantity > 0),
    recorded_unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (recorded_unit_cost >= 0),
    recorded_selling_price NUMERIC(10, 2) NOT NULL CHECK (recorded_selling_price >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0)
);

-- 4. Optimization Indexes
CREATE INDEX idx_invoices_lookup ON invoices(invoice_number, status);
CREATE INDEX idx_invoices_branch ON invoices(branch_id);
CREATE INDEX idx_invoice_items_parent ON invoice_items(invoice_id);