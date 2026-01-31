-- Update prospects table to match NetSuite fields
ALTER TABLE prospects DROP COLUMN IF EXISTS industry;
ALTER TABLE prospects DROP COLUMN IF EXISTS employees;
ALTER TABLE prospects DROP COLUMN IF EXISTS annual_revenue;
ALTER TABLE prospects DROP COLUMN IF EXISTS billing_models;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS subsidiary VARCHAR(255);
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS status VARCHAR(100);

-- Update customers table to match NetSuite fields
ALTER TABLE customers DROP COLUMN IF EXISTS industry;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS subsidiary VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status VARCHAR(100);
