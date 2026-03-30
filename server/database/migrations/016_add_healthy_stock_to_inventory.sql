-- Migration: 016_add_healthy_stock_to_inventory 
-- Description: Add healthy_stock_per_branch to master_inventory
ALTER TABLE master_inventory
ADD COLUMN IF NOT EXISTS healthy_stock_per_branch INTEGER DEFAULT 10;