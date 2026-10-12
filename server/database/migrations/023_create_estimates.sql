-- 023_create_estimates.sql
-- Purpose: Schema for pre-sales quotation documents (Zero Ledger Impact)

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE estimate_status_enum AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED');
    CREATE TYPE estimate_line_type AS ENUM ('SERVICE', 'PART');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Parent Document Table
CREATE TABLE IF NOT EXISTS estimates (
    id SERIAL PRIMARY KEY,
    estimate_number VARCHAR(30) UNIQUE NOT NULL, -- Format: EST-YYYYMM-XXXX
    customer_id INT REFERENCES customers(id) ON DELETE RESTRICT,
    branch_id INT REFERENCES branches(id) ON DELETE RESTRICT,
    
    -- Financials (Calculated & Frozen by Backend)
    subtotal NUMERIC(10, 2) DEFAULT 0.00 CHECK (subtotal >= 0),
    total_discount NUMERIC(10, 2) DEFAULT 0.00 CHECK (total_discount >= 0),
    vat_amount NUMERIC(10, 2) DEFAULT 0.00 CHECK (vat_amount >= 0),
    grand_total NUMERIC(10, 2) DEFAULT 0.00 CHECK (grand_total >= 0),
    
    status estimate_status_enum DEFAULT 'DRAFT',
    valid_until DATE NOT NULL,
    notes TEXT,
    terms_conditions TEXT,
    
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Child Line-Item Matrix
CREATE TABLE IF NOT EXISTS estimate_items (
    id SERIAL PRIMARY KEY,
    estimate_id INT REFERENCES estimates(id) ON DELETE CASCADE,
    line_type estimate_line_type NOT NULL,
    
    -- Polymorphic Foreign Keys
    service_id INT REFERENCES services(id) ON DELETE RESTRICT, 
    item_id INT REFERENCES inventory_items(id) ON DELETE RESTRICT,
    
    quantity INT NOT NULL CHECK (quantity > 0),
    recorded_unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (recorded_unit_cost >= 0),
    recorded_selling_price NUMERIC(10, 2) NOT NULL CHECK (recorded_selling_price >= 0),
    discount_amount NUMERIC(10, 2) DEFAULT 0.00 CHECK (discount_amount >= 0)
);

-- 4. Optimization Indexes
CREATE INDEX idx_estimates_customer ON estimates(customer_id);
CREATE INDEX idx_estimates_branch ON estimates(branch_id);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimate_items_parent ON estimate_items(estimate_id);