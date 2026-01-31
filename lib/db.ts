import { neon } from "@neondatabase/serverless"

// Create a sql tagged template function for queries
export const sql = neon(process.env.DATABASE_URL!)

// Helper function to handle database errors
export function handleDbError(error: any, operation: string) {
  console.error(`Error during ${operation}:`, error)
  return { error: `Failed to ${operation}` }
}

export async function initializeDatabase() {
  // Placeholder for database initialization logic
  // In a real application, this function might contain code to:
  // 1. Check if the database exists.
  // 2. Create the database if it doesn't exist.
  // 3. Run database migrations.
  // 4. Seed the database with initial data.
  console.log("Database initialized (placeholder)")
}
