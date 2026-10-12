-- 034_create_bills.sql
-- Purpose: Schema for Official Supplier Bills & Accounts Payable

-- 1. Create Status Enum
DO $$ BEGIN
    CREATE TYPE bill_status_enum AS ENUM ('PENDING_RECEIPT', 'RECEIVED', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Parent Table: Bills
CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    bill_number VARCHAR(30) UNIQUE NOT NULL, -- Format: BILL-YYYYMM-XXXX
    purchase_order_id INT UNIQUE NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    vendor_id INT NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    
    vendor_invoice_number VARCHAR(100) NOT NULL,
    bill_date DATE NOT NULL,
    date_received DATE,
    status bill_status_enum DEFAULT 'PENDING_RECEIPT',
    
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0.00),
    vat_amount NUMERIC(10, 2) NOT NULL CHECK (vat_amount >= 0.00),
    grand_total NUMERIC(10, 2) NOT NULL CHECK (grand_total >= 0.00),
    notes TEXT,
    
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Prevents double billing the same supplier receipt number for a given vendor
    CONSTRAINT unique_vendor_invoice_per_vendor UNIQUE (vendor_id, vendor_invoice_number)
);

-- 3. Child Table: Bill Items
CREATE TABLE IF NOT EXISTS bill_items (
    id SERIAL PRIMARY KEY,
    bill_id INT REFERENCES bills(id) ON DELETE CASCADE,
    item_id INT NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity_received INT NOT NULL CHECK (quantity_received > 0),
    recorded_unit_cost NUMERIC(10, 2) NOT NULL CHECK (recorded_unit_cost >= 0.00),
    discount_amount NUMERIC(10, 2) DEFAULT 0.00 CHECK (discount_amount >= 0.00)
);

-- 4. Performance Indexes
CREATE INDEX idx_bills_branch_status ON bills(branch_id, status);
CREATE INDEX idx_bills_po ON bills(purchase_order_id);
CREATE INDEX idx_bill_items_parent ON bill_items(bill_id);