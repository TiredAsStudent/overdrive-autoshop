-- 027_create_vendors.sql
-- Purpose: Schema for Supplier Relationship Management Master Directory

CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    vendor_code VARCHAR(30) UNIQUE NOT NULL, -- Format: VEND-YYYYMM-XXXX
    business_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    business_address TEXT NOT NULL,
    contact_number VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    tin VARCHAR(15), -- Validated via regex at API level
    is_vat_registered BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    branch_id INT REFERENCES branches(id) ON DELETE RESTRICT, -- BR-08 Compliance
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    
    -- Enforce local branch-level name uniqueness while allowing branch duplication
    CONSTRAINT unique_vendor_name_per_branch UNIQUE (branch_id, business_name)
);

-- Query Acceleration Indexes
CREATE INDEX idx_vendors_branch_search ON vendors(branch_id, is_active);
CREATE INDEX idx_vendors_text_lookup ON vendors(business_name, vendor_code);