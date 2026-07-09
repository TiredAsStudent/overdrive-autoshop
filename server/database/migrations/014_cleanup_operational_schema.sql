-- 014_cleanup_operational_schema.sql
-- Purpose: Safely removes all Staff and Manager operational tables and custom types
-- to provide a clean slate for the new architecture. 
-- Preserves Users, Branches, System Settings, Audit Logs, and Backup Logs.

-- 1. Drop Tables (Using CASCADE to safely handle foreign key constraints)
DROP TABLE IF EXISTS general_ledger CASCADE;
DROP TABLE IF EXISTS expense_items CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS vat_ledger CASCADE;
DROP TABLE IF EXISTS branch_inventory CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS mechanics CASCADE;
DROP TABLE IF EXISTS chart_of_accounts CASCADE;

-- 2. Drop Custom Enums/Types associated with the deleted tables
DROP TYPE IF EXISTS expense_status CASCADE;
DROP TYPE IF EXISTS vat_transaction_type CASCADE;
DROP TYPE IF EXISTS vat_category CASCADE;
DROP TYPE IF EXISTS vat_reference_type CASCADE;