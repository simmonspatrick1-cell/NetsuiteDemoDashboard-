import { NextResponse } from "next/server"

export async function GET() {
  // Check if DATABASE_URL is missing or empty
  const demoMode = !process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === ""

  return NextResponse.json({
    demoMode,
    timestamp: new Date().toISOString(),
  })
}
