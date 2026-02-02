-- Update service_items table to match NetSuite field naming conventions
-- Migration: Add NetSuite-specific fields for service items

-- Remove old columns that don't match NetSuite naming
ALTER TABLE service_items DROP COLUMN IF EXISTS rate;
ALTER TABLE service_items DROP COLUMN IF EXISTS rate_type;

-- Add NetSuite-mapped columns
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS qty NUMERIC(10,2);
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS sales_price NUMERIC(12,2);
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2);
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS income_account VARCHAR(255);
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS expense_account VARCHAR(255);
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS tax_schedule VARCHAR(100);
