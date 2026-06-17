-- 012_remove_ai_settings.sql
-- Purpose: Cleanly drop all AI configuration columns from the system_settings table 
-- to enforce architectural purity and migrate settings to server environment variables.

ALTER TABLE system_settings 
DROP COLUMN IF EXISTS gemini_api_key,
DROP COLUMN IF EXISTS ai_confidence_threshold,
DROP COLUMN IF EXISTS ai_model,
DROP COLUMN IF EXISTS ai_htr_enabled,
DROP COLUMN IF EXISTS ai_omr_enabled,
DROP COLUMN IF EXISTS ai_system_instruction,
DROP COLUMN IF EXISTS ai_total_scans,
DROP COLUMN IF EXISTS ai_successful_scans,
DROP COLUMN IF EXISTS ai_flagged_scans;