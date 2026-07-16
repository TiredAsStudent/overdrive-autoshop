-- 028_create_purchase_orders.sql
-- Purpose: Schema for official Procurement Commitments (Zero immediate Ledger Impact)

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE purchase_order_status_enum AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CLOSED', 'CANCELLED');
    CREATE TYPE purchase_order_line_type_enum AS ENUM ('PART', 'SUBLET');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Parent Document Table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    purchase_order_number VARCHAR(30) UNIQUE NOT NULL, -- Format: PO-YYYYMM-XXXX
    vendor_id INT NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT, -- BR-01 Compliance
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT, -- BR-09 Compliance
    
    -- Financial Architecture
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0.00),
    vat_amount NUMERIC(10, 2) NOT NULL CHECK (vat_amount >= 0.00),
    grand_total NUMERIC(10, 2) NOT NULL CHECK (grand_total >= 0.00),
    
    status purchase_order_status_enum DEFAULT 'DRAFT',
    expected_delivery_date DATE NOT NULL,
    notes TEXT,
    approval_remarks TEXT, -- Used by Managers to state rejection/approval reasons
    
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Child Item Matrix Layout
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INT REFERENCES purchase_orders(id) ON DELETE CASCADE,
    line_type purchase_order_line_type_enum NOT NULL,
    
    -- Polymorphic Sourcing
    item_id INT REFERENCES inventory_items(id) ON DELETE RESTRICT, -- Used if line_type is 'PART'
    sublet_description VARCHAR(255),                               -- Used if line_type is 'SUBLET'
    
    quantity INT NOT NULL CHECK (quantity > 0), -- VR-03 Enforced
    recorded_unit_cost NUMERIC(10, 2) NOT NULL CHECK (recorded_unit_cost >= 0.00), -- VR-04 Enforced
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0.00)
);

-- 4. Optimization Indexes
CREATE INDEX idx_purchase_orders_lookup ON purchase_orders(purchase_order_number, status);
CREATE INDEX idx_purchase_orders_branch ON purchase_orders(branch_id);
CREATE INDEX idx_purchase_order_items_parent ON purchase_order_items(purchase_order_id);