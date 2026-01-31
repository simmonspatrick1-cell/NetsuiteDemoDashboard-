import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import type { EntityType } from "@/lib/demo-types";

export async function POST(req: Request) {
  try {
    const { entityType } = (await req.json()) as { entityType: EntityType };

    switch (entityType) {
      case "prospects":
        await sql`DELETE FROM prospects`;
        break;
      case "customers":
        // Delete related data first due to foreign keys
        await sql`DELETE FROM tasks`;
        await sql`DELETE FROM projects`;
        await sql`DELETE FROM customers`;
        break;
      case "service_items":
        await sql`DELETE FROM service_items`;
        break;
      case "projects":
        await sql`DELETE FROM tasks`;
        await sql`DELETE FROM projects`;
        break;
      case "tasks":
        await sql`DELETE FROM tasks`;
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing data:", error);
    return NextResponse.json(
      { error: "Failed to clear data" },
      { status: 500 }
    );
  }
}
