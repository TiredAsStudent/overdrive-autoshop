-- 029_update_invoice_payment_status_enum.sql

ALTER TYPE invoice_payment_status_enum
ADD VALUE IF NOT EXISTS 'VOID';