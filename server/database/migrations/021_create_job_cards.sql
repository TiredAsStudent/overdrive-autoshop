-- 021_create_job_cards.sql

-- Support Hybrid Registration & Predictive Maintenance
ALTER TABLE vehicles ALTER COLUMN make DROP NOT NULL;
ALTER TABLE vehicles ALTER COLUMN model DROP NOT NULL;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_odometer_reading INTEGER DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS next_service_odometer INTEGER DEFAULT 0;

-- Create Job Status ENUM
CREATE TYPE job_status AS ENUM ('PENDING', 'ONGOING', 'DONE', 'CANCELLED');

-- Create Job Cards Table (The "Ticket" for the visit)
CREATE TABLE IF NOT EXISTS job_cards (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE RESTRICT,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    mechanic_id INTEGER REFERENCES mechanics(id) ON DELETE SET NULL,
    staff_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Accountability Trail
    status job_status DEFAULT 'PENDING',
    service_intent VARCHAR(100),
    check_in_odometer INTEGER NOT NULL,
    next_service_odometer INTEGER NOT NULL, -- Snapshot of the target for this specific visit
    customer_notes TEXT,
    diagnostic_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- High-Performance Indexes
CREATE INDEX idx_job_cards_branch_status ON job_cards(branch_id, status);
CREATE INDEX idx_job_cards_vehicle ON job_cards(vehicle_id);