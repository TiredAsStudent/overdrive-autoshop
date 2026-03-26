-- Migration: 006_vehicles_garage
-- Description: Creates the Vehicles table and Plate-Based Medical Record foundation

-- Create Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER,
    color VARCHAR(30),
    owner_first_name VARCHAR(100) NOT NULL,
    owner_last_name VARCHAR(100) NOT NULL,
    owner_email VARCHAR(255) NOT NULL, -- Bridges to users.email
    owner_phone VARCHAR(20),
    registered_branch_id INTEGER REFERENCES branches(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an Index for lightning-fast plate searches safely
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate_number);