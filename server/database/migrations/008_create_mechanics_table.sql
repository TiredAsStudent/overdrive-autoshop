-- 008_create_mechanics_table.sql

CREATE TABLE IF NOT EXISTS mechanics (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE RESTRICT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(150),
    contact_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- High-Performance Indexes
--  Speeds up the Staff's "Assign Mechanic" dropdown on the Kanban board
CREATE INDEX idx_mechanics_branch_active ON mechanics(branch_id, is_active);

-- Speeds up searches by name
CREATE INDEX idx_mechanics_name ON mechanics(last_name, first_name);