import { NextResponse } from "next/server";
import { updateServiceItem, deleteServiceItem } from "@/lib/demo-data";

export async function PATCH(req: Request) {
  try {
    const { id, ...updates } = await req.json();

    if (!id || typeof id !== "number") {
      return NextResponse.json(
        { error: "Service item ID is required" },
        { status: 400 }
      );
    }

    const updatedItem = await updateServiceItem(id, updates);

    return NextResponse.json({ success: true, data: updatedItem });
  } catch (error) {
    console.error("Error updating service item:", error);
    return NextResponse.json(
      { error: "Failed to update service item" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id || typeof id !== "number") {
      return NextResponse.json(
        { error: "Service item ID is required" },
        { status: 400 }
      );
    }

    await deleteServiceItem(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service item:", error);
    return NextResponse.json(
      { error: "Failed to delete service item" },
      { status: 500 }
    );
  }
}
