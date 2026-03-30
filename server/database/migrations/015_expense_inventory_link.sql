-- Migration: 015_expense_inventory_link
-- Description: Links OCR text items to actual master inventory parts

ALTER TABLE expense_line_items
ADD COLUMN IF NOT EXISTS master_part_id INTEGER REFERENCES master_inventory(id) ON DELETE SET NULL;