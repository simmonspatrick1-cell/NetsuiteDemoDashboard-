-- Update projects table to match NetSuite fields
-- Remove old columns that don't map to NetSuite
ALTER TABLE projects DROP COLUMN IF EXISTS prospect_id;
ALTER TABLE projects DROP COLUMN IF EXISTS billing_type;
ALTER TABLE projects DROP COLUMN IF EXISTS budget;
ALTER TABLE projects DROP COLUMN IF EXISTS end_date;
ALTER TABLE projects DROP COLUMN IF EXISTS status;

-- Add NetSuite-mapped columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_id VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS subsidiary VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_status VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_manager VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS scheduling_method VARCHAR(50) DEFAULT 'Forward';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS calculated_end_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_end_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS planned_work NUMERIC(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS percent_complete NUMERIC(5,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20) DEFAULT 'None';
