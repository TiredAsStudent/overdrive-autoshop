-- 005_create_mechanics.sql

CREATE TABLE IF NOT EXISTS mechanics (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., MECH-2026-001
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(50),
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT, -- Must belong to a branch
    skills TEXT[] DEFAULT '{General Technician}', -- Array for Skill Tagging
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'On Leave')),
    hire_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed Initial Data (Linking to Branch ID 1, assuming 1 is Biñan or Cabuyao)
INSERT INTO mechanics (employee_id, first_name, last_name, phone_number, branch_id, skills)
VALUES 
('MECH-001', 'Leo', 'Cereno', '09123456789', 1, ARRAY['Engine Specialist', 'Underchassis']),
('MECH-002', 'Juan', 'Dela Cruz', '09987654321', 1, ARRAY['Electrical', 'Aircon Tech'])
ON CONFLICT (employee_id) DO NOTHING;