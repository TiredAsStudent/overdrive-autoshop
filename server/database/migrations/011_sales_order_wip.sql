-- Migration: 011_sales_order_wip
-- Description: Adds the "Reserved Stock" column and WIP status

--  Upgrade the Status ENUM to include 'WIP'
ALTER TYPE estimate_status ADD VALUE IF NOT EXISTS 'WIP';

-- Upgrade the Local Stock (The Shelves)
ALTER TABLE branch_local_stock 
ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER NOT NULL DEFAULT 0;

-- The Math Padlock (Prevents reserving more than that physically have)
ALTER TABLE branch_local_stock
ADD CONSTRAINT check_available_stock CHECK (quantity >= reserved_quantity);