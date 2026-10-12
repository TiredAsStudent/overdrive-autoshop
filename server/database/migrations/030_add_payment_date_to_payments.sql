-- 030_add_payment_date_to_payments.sql

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT CURRENT_DATE;