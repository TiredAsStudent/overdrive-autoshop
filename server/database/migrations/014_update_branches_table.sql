-- 014_update_branches_table.sql

ALTER TABLE branches 
DROP COLUMN IF EXISTS invoice_header,
DROP COLUMN IF EXISTS invoice_footer;