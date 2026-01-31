-- Create prospects table
CREATE TABLE IF NOT EXISTS prospects (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  website_url TEXT,
  industry TEXT,
  employees INTEGER,
  annual_revenue TEXT,
  billing_models TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  prospect_id INTEGER REFERENCES prospects(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  contact_name TEXT,
  contact_email TEXT,
  selected BOOLEAN DEFAULT true,
  netsuite_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_items table
CREATE TABLE IF NOT EXISTS service_items (
  id SERIAL PRIMARY KEY,
  prospect_id INTEGER REFERENCES prospects(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL,
  rate DECIMAL(10, 2),
  rate_type TEXT,
  description TEXT,
  selected BOOLEAN DEFAULT true,
  netsuite_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  prospect_id INTEGER REFERENCES prospects(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  billing_type TEXT,
  budget DECIMAL(12, 2),
  status TEXT DEFAULT 'Planning',
  start_date DATE,
  end_date DATE,
  selected BOOLEAN DEFAULT true,
  netsuite_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  prospect_id INTEGER REFERENCES prospects(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  estimated_hours DECIMAL(6, 2),
  assigned_role TEXT,
  selected BOOLEAN DEFAULT true,
  netsuite_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
