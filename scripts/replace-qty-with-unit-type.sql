-- Migration: Replace qty with unit_type in service_items table
-- unit_type represents the unit of measure (e.g., "Hour", "Day", "Each", "Project")

-- Add unit_type column
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS unit_type VARCHAR(50);

-- Drop qty column
ALTER TABLE service_items DROP COLUMN IF EXISTS qty;
