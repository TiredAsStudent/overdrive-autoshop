-- 002_add_ai_settings.sql

ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS gemini_api_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS ai_confidence_threshold NUMERIC(3,2) DEFAULT 0.85,
ADD COLUMN IF NOT EXISTS ai_model VARCHAR(50) DEFAULT 'gemini-1.5-flash',
ADD COLUMN IF NOT EXISTS ai_htr_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS ai_omr_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS ai_system_instruction TEXT DEFAULT 'You are an expert automotive accounting AI. Accurately extract the TIN, Date, and Total Amount from Philippine receipts.',
ADD COLUMN IF NOT EXISTS ai_total_scans INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_successful_scans INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_flagged_scans INT DEFAULT 0;