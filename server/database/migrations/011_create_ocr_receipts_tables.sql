-- 011_create_ocr_receipts_tables.sql

-- The main table holding the scanned receipt and the AI's summary
CREATE TABLE IF NOT EXISTS receipt_scans (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
    uploaded_by INTEGER REFERENCES users(id), -- The Staff 'Maker'
    image_url VARCHAR(255) NOT NULL,
    vendor_name VARCHAR(150),
    invoice_number VARCHAR(100),
    receipt_date DATE,
    total_amount DECIMAL(12, 2),
    account_category_id INTEGER REFERENCES account_categories(id), -- ALIGNED WITH 007
    ai_confidence_score DECIMAL(5, 2), 
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by INTEGER REFERENCES users(id), 
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- The line items extracted by the AI (The Parts)
CREATE TABLE IF NOT EXISTS receipt_scan_items (
    id SERIAL PRIMARY KEY,
    receipt_scan_id INTEGER REFERENCES receipt_scans(id) ON DELETE CASCADE,
    inventory_id INTEGER REFERENCES inventory(id), 
    description VARCHAR(255), 
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_cost DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL
);