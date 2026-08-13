-- 044_add_adjustment_evidence.sql
-- Purpose: Adds photo evidence tracking for internal audit controls on stock discrepancies.

ALTER TABLE stock_adjustment_requests 
ADD COLUMN IF NOT EXISTS evidence_url VARCHAR(500);

-- Documentation
COMMENT ON COLUMN stock_adjustment_requests.evidence_url IS 'Relative path to the uploaded photo evidence for the discrepancy (e.g., damaged items).';