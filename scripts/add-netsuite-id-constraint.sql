-- Add unique constraints on netsuite_id columns for upsert operations
-- This allows ON CONFLICT to work properly

ALTER TABLE customers 
ADD CONSTRAINT customers_netsuite_id_unique UNIQUE (netsuite_id);

ALTER TABLE projects 
ADD CONSTRAINT projects_netsuite_id_unique UNIQUE (netsuite_id);

ALTER TABLE service_items 
ADD CONSTRAINT service_items_netsuite_id_unique UNIQUE (netsuite_id);

ALTER TABLE tasks 
ADD CONSTRAINT tasks_netsuite_id_unique UNIQUE (netsuite_id);
