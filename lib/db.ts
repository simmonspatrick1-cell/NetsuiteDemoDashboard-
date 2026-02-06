import { neon } from "@neondatabase/serverless"

// Create a sql tagged template function for queries
export const sql = neon(process.env.DATABASE_URL!)

// Helper function to handle database errors
export function handleDbError(error: any, operation: string) {
  console.error(`Error during ${operation}:`, error)
  return { error: `Failed to ${operation}` }
}

export async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS prospects (
      id SERIAL PRIMARY KEY,
      company_name TEXT NOT NULL,
      website_url TEXT,
      phone TEXT,
      email TEXT,
      subsidiary TEXT,
      status TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      phone TEXT,
      subsidiary TEXT,
      status TEXT,
      prospect_id INTEGER REFERENCES prospects(id) ON DELETE SET NULL,
      netsuite_id TEXT,
      selected BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS service_items (
      id SERIAL PRIMARY KEY,
      item_name TEXT NOT NULL,
      display_name TEXT,
      item_type TEXT NOT NULL,
      description TEXT,
      unit_type TEXT,
      sales_price NUMERIC,
      purchase_price NUMERIC,
      income_account TEXT,
      expense_account TEXT,
      tax_schedule TEXT,
      prospect_id INTEGER REFERENCES prospects(id) ON DELETE SET NULL,
      netsuite_id TEXT,
      selected BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      project_id TEXT,
      project_name TEXT NOT NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      subsidiary TEXT,
      project_status TEXT,
      project_manager TEXT,
      scheduling_method TEXT,
      start_date DATE,
      calculated_end_date DATE,
      estimated_end_date DATE,
      planned_work NUMERIC,
      percent_complete NUMERIC,
      risk_level TEXT,
      netsuite_id TEXT,
      selected BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      task_name TEXT NOT NULL,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      prospect_id INTEGER REFERENCES prospects(id) ON DELETE SET NULL,
      assigned_role TEXT,
      estimated_hours NUMERIC,
      netsuite_id TEXT,
      selected BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  // Add columns that may be missing from older table versions
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS selected BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS netsuite_id TEXT`;
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT`;
  await sql`ALTER TABLE service_items ADD COLUMN IF NOT EXISTS selected BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE service_items ADD COLUMN IF NOT EXISTS netsuite_id TEXT`;
  await sql`ALTER TABLE service_items ADD COLUMN IF NOT EXISTS display_name TEXT`;
  await sql`ALTER TABLE service_items ADD COLUMN IF NOT EXISTS unit_type TEXT`;
  await sql`ALTER TABLE service_items ADD COLUMN IF NOT EXISTS sales_price NUMERIC`;
  await sql`ALTER TABLE service_items ADD COLUMN IF NOT EXISTS purchase_price NUMERIC`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS selected BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS netsuite_id TEXT`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_status TEXT`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_manager TEXT`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_name TEXT`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS customer_id INTEGER`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_id TEXT`;
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS selected BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS netsuite_id TEXT`;

  // Add UNIQUE constraint on netsuite_id if not present (for ON CONFLICT)
  // Drop partial indexes first if they exist, then create non-partial ones
  await sql`DROP INDEX IF EXISTS idx_customers_netsuite_id`;
  await sql`DROP INDEX IF EXISTS idx_service_items_netsuite_id`;
  await sql`DROP INDEX IF EXISTS idx_projects_netsuite_id`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_netsuite_id ON customers(netsuite_id)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_service_items_netsuite_id ON service_items(netsuite_id)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_netsuite_id ON projects(netsuite_id)`;

  console.log("Database tables initialized successfully");
}
