-- 004_create_vehicles_table.sql
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for the universal plate-based search you planned
CREATE INDEX idx_vehicles_plate_number ON vehicles(plate_number);