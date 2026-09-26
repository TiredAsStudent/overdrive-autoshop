-- 060_create_journal_entries.sql
-- Purpose: Normalized Double-Entry Architecture for Manual Journal Adjustments

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE journal_status_enum AS ENUM ('DRAFT', 'POSTED');
    CREATE TYPE journal_entry_type_enum AS ENUM ('DEBIT', 'CREDIT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Parent Header Table
CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    journal_number VARCHAR(30) UNIQUE NOT NULL, -- Format: JRN-YYYYMM-XXXX
    entry_date DATE NOT NULL,
    reference_number VARCHAR(100),
    description TEXT NOT NULL,
    
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount > 0),
    status journal_status_enum DEFAULT 'DRAFT',
    
    branch_id INT REFERENCES branches(id) ON DELETE RESTRICT, -- Nullable for global/enterprise adjustments
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Child Line Items Table
CREATE TABLE IF NOT EXISTS journal_entry_items (
    id SERIAL PRIMARY KEY,
    journal_entry_id INT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id INT NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    
    entry_type journal_entry_type_enum NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    line_description TEXT
);

-- 4. High-Performance Ledger Indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_branch ON journal_entries(branch_id);
CREATE INDEX IF NOT EXISTS idx_journal_items_parent ON journal_entry_items(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_items_account ON journal_entry_items(account_id);