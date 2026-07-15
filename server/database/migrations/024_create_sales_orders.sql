-- 024_create_sales_orders.sql
-- Purpose: Schema for internal operational Work Orders / Sales Orders

-- 1. Create Status Enum
DO $$ BEGIN
    CREATE TYPE sales_order_status_enum AS ENUM (
        'PENDING_SERVICE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'INVOICED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Parent Document Table
CREATE TABLE IF NOT EXISTS sales_orders (
    id SERIAL PRIMARY KEY,
    sales_order_number VARCHAR(30) UNIQUE NOT NULL, -- Format: SO-YYYYMM-XXXX
    estimate_id INT UNIQUE NOT NULL REFERENCES estimates(id) ON DELETE RESTRICT, -- VR-03 Compliance (1-to-1)
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    
    -- Financial Snapshots (Exact immutable copy from Estimate)
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    total_discount NUMERIC(10, 2) NOT NULL CHECK (total_discount >= 0),
    vat_amount NUMERIC(10, 2) NOT NULL CHECK (vat_amount >= 0),
    grand_total NUMERIC(10, 2) NOT NULL CHECK (grand_total >= 0),
    
    status sales_order_status_enum DEFAULT 'PENDING_SERVICE',
    estimated_completion_date DATE,
    notes TEXT,
    
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Child Item Snapshot Layout
CREATE TABLE IF NOT EXISTS sales_order_items (
    id SERIAL PRIMARY KEY,
    sales_order_id INT REFERENCES sales_orders(id) ON DELETE CASCADE,
    line_type estimate_line_type NOT NULL, -- Reuses the existing Enum
    
    service_id INT REFERENCES services(id) ON DELETE RESTRICT,
    item_id INT REFERENCES inventory_items(id) ON DELETE RESTRICT,
    
    quantity INT NOT NULL CHECK (quantity > 0),
    recorded_unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (recorded_unit_cost >= 0),
    recorded_selling_price NUMERIC(10, 2) NOT NULL CHECK (recorded_selling_price >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0)
);

-- 4. Optimization Indexes
CREATE INDEX idx_sales_orders_lookup ON sales_orders(sales_order_number, status);
CREATE INDEX idx_sales_orders_branch ON sales_orders(branch_id);
CREATE INDEX idx_sales_order_items_parent ON sales_order_items(sales_order_id);