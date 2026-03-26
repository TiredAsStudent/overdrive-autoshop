-- Create Roles
CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF', 'CUSTOMER');

-- Create Branches Table
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL UNIQUE,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE RESTRICT,
    role user_role NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE, 
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Closed-Loop Invitations Table
CREATE TABLE user_invitations (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    branch_id INTEGER REFERENCES branches(id),
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    invited_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    branch_id INTEGER REFERENCES branches(id),
    action VARCHAR(255) NOT NULL,
    target_resource VARCHAR(100),
    target_id INTEGER,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);