-- 006_create_services.sql

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    service_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., CHG-OIL, ENG-001
    service_name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0), -- Master Pricing (Financial Safety)
    estimated_minutes INT DEFAULT 60 CHECK (estimated_minutes > 0), -- For efficiency tracking
    is_vatable BOOLEAN DEFAULT TRUE, -- Tax automation toggle
    is_active BOOLEAN DEFAULT TRUE, -- Soft-delete tombstone
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed Initial Data (Aligned with your Mechanic Specialties)
INSERT INTO services (service_code, service_name, description, price, estimated_minutes, is_vatable)
VALUES 
('LBR-OIL-01', 'Standard Change Oil & Filter', 'Drain old oil, replace oil filter, refill with standard synthetic oil.', 500.00, 45, TRUE),
('LBR-BRK-01', 'Brake Pad Replacement (Front)', 'Remove old brake pads, clean calipers, install new pads, bleed lines.', 800.00, 90, TRUE),
('LBR-AC-01', 'Aircon Freon Recharge', 'Vacuum AC system, leak test, and recharge freon to optimal levels.', 1200.00, 60, TRUE),
('LBR-ENG-01', 'ECU / OBD Diagnostic Scan', 'Connect OBD scanner to ECU to read engine fault codes and clear dashboard lights.', 1500.00, 30, TRUE),
('LBR-UND-01', 'Wheel Alignment & Camber', 'Laser alignment of front and rear wheels to prevent uneven tire wear.', 1000.00, 60, TRUE)
ON CONFLICT (service_code) DO NOTHING;