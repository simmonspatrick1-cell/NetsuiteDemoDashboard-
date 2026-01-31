import { NextResponse } from "next/server";
import {
  getProspects,
  getCustomers,
  getServiceItems,
  getProjects,
  getTasks,
  getEntityCounts,
} from "@/lib/demo-data";

export async function GET() {
  try {
    const [counts, prospects, customers, serviceItems, projects, tasks] =
      await Promise.all([
        getEntityCounts(),
        getProspects(),
        getCustomers(),
        getServiceItems(),
        getProjects(),
        getTasks(),
      ]);

    return NextResponse.json({
      counts,
      prospects,
      customers,
      serviceItems,
      projects,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching demo data:", error);
    return NextResponse.json(
      { error: "Failed to fetch demo data" },
      { status: 500 }
    );
  }
}
