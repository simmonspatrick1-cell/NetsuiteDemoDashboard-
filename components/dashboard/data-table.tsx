"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Prospect, Customer, ServiceItem, Project, Task, EntityType } from "@/lib/demo-types";

interface DataTableProps {
  entityType: EntityType;
  data: Prospect[] | Customer[] | ServiceItem[] | Project[] | Task[];
  onDataChange?: () => void;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-500",
  contacted: "bg-yellow-500/10 text-yellow-500",
  qualified: "bg-green-500/10 text-green-500",
  proposal: "bg-purple-500/10 text-purple-500",
  closed: "bg-gray-500/10 text-gray-500",
  planning: "bg-blue-500/10 text-blue-500",
  active: "bg-green-500/10 text-green-500",
  on_hold: "bg-yellow-500/10 text-yellow-500",
  completed: "bg-gray-500/10 text-gray-500",
  pending: "bg-yellow-500/10 text-yellow-500",
  in_progress: "bg-blue-500/10 text-blue-500",
};

// Fallback unit types if API fails
const FALLBACK_UNIT_TYPES = [
  { id: "Hour", name: "Hour" },
  { id: "Day", name: "Day" },
  { id: "Week", name: "Week" },
  { id: "Each", name: "Each" },
];

export function DataTable({ entityType, data, onDataChange }: DataTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    unit_type?: string;
    sales_price?: string;
    purchase_price?: string;
  }>({});
  const [unitTypes, setUnitTypes] = useState<{ id: string; name: string }[]>(FALLBACK_UNIT_TYPES);

  // Fetch unit types from NetSuite on mount
  useEffect(() => {
    async function fetchUnitTypes() {
      try {
        const response = await fetch("/api/netsuite-fields?type=unit_types");
        const result = await response.json();
        if (result.success && result.data?.length > 0) {
          setUnitTypes(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch unit types, using fallback:", error);
      }
    }
    fetchUnitTypes();
  }, []);

  const handleEditStart = (item: ServiceItem) => {
    setEditingId(item.id);
    setEditValues({
      unit_type: item.unit_type || "",
      sales_price: item.sales_price?.toString() || "",
      purchase_price: item.purchase_price?.toString() || "",
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleEditSave = async (id: number) => {
    try {
      const response = await fetch("/api/service-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          unit_type: editValues.unit_type || null,
          sales_price: editValues.sales_price ? parseFloat(editValues.sales_price) : null,
          purchase_price: editValues.purchase_price ? parseFloat(editValues.purchase_price) : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Service item updated");
        setEditingId(null);
        setEditValues({});
        onDataChange?.();
      } else {
        toast.error(result.error || "Failed to update");
      }
    } catch (error) {
      toast.error("Failed to update service item");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch("/api/service-items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Service item deleted");
        onDataChange?.();
      } else {
        toast.error(result.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("Failed to delete service item");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, itemId: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEditSave(itemId);
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">No records yet. Generate some data to get started.</p>
      </div>
    );
  }

  const renderProspectsTable = (prospects: Prospect[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-foreground">Company</TableHead>
          <TableHead className="text-foreground">Email</TableHead>
          <TableHead className="text-foreground">Phone</TableHead>
          <TableHead className="text-foreground">Status</TableHead>
          <TableHead className="text-foreground">Website</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {prospects.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium text-foreground">{p.company_name}</TableCell>
            <TableCell className="text-muted-foreground">{p.email || "-"}</TableCell>
            <TableCell className="text-muted-foreground">{p.phone || "-"}</TableCell>
            <TableCell className="text-muted-foreground">{p.status || "-"}</TableCell>
            <TableCell className="text-muted-foreground">{p.website_url || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderCustomersTable = (customers: Customer[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-foreground">Company</TableHead>
          <TableHead className="text-foreground">Contact</TableHead>
          <TableHead className="text-foreground">Email</TableHead>
          <TableHead className="text-foreground">Phone</TableHead>
          <TableHead className="text-foreground">NetSuite ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium text-foreground">{c.company_name}</TableCell>
            <TableCell className="text-muted-foreground">{c.contact_name}</TableCell>
            <TableCell className="text-muted-foreground">{c.contact_email}</TableCell>
            <TableCell className="text-muted-foreground">{c.phone || "-"}</TableCell>
            <TableCell className="text-muted-foreground">{c.netsuite_id || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderServiceItemsTable = (items: ServiceItem[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-foreground">Item Name/Number</TableHead>
          <TableHead className="text-foreground">Display Name</TableHead>
          <TableHead className="text-foreground">Type</TableHead>
          <TableHead className="text-foreground">Unit Type</TableHead>
          <TableHead className="text-foreground">Sales Price</TableHead>
          <TableHead className="text-foreground">Purchase Price</TableHead>
          <TableHead className="text-foreground">Description</TableHead>
          <TableHead className="text-foreground w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium text-foreground">{item.item_name}</TableCell>
            <TableCell className="text-muted-foreground">{item.display_name || "-"}</TableCell>
            <TableCell className="text-muted-foreground">{item.item_type}</TableCell>
            {editingId === item.id ? (
              <>
                <TableCell>
                  <select
                    className="w-24 h-8 rounded-md border border-input bg-background px-2 text-sm"
                    value={editValues.unit_type || ""}
                    onChange={(e) => setEditValues({ ...editValues, unit_type: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {unitTypes.map((ut) => (
                      <option key={ut.id} value={ut.name}>{ut.name}</option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    className="w-24 h-8"
                    value={editValues.sales_price || ""}
                    onChange={(e) => setEditValues({ ...editValues, sales_price: e.target.value })}
                    onKeyDown={(e) => handleKeyDown(e, item.id)}
                    placeholder="Sales Price"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    className="w-24 h-8"
                    value={editValues.purchase_price || ""}
                    onChange={(e) => setEditValues({ ...editValues, purchase_price: e.target.value })}
                    onKeyDown={(e) => handleKeyDown(e, item.id)}
                    placeholder="Purchase Price"
                  />
                </TableCell>
              </>
            ) : (
              <>
                <TableCell className="text-muted-foreground">{item.unit_type || "-"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.sales_price != null ? `$${Number(item.sales_price).toFixed(2)}` : "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.purchase_price != null ? `$${Number(item.purchase_price).toFixed(2)}` : "-"}
                </TableCell>
              </>
            )}
            <TableCell className="text-muted-foreground max-w-xs truncate">{item.description || "-"}</TableCell>
            <TableCell>
              {editingId === item.id ? (
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditSave(item.id)}>
                    <Check className="h-4 w-4 text-green-500" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleEditCancel}>
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditStart(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderProjectsTable = (projects: Project[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-foreground">Project ID</TableHead>
          <TableHead className="text-foreground">Name</TableHead>
          <TableHead className="text-foreground">Customer</TableHead>
          <TableHead className="text-foreground">Status</TableHead>
          <TableHead className="text-foreground">Start Date</TableHead>
          <TableHead className="text-foreground">Risk Level</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="text-muted-foreground">{p.project_id || "-"}</TableCell>
            <TableCell className="font-medium text-foreground">{p.project_name}</TableCell>
            <TableCell className="text-muted-foreground">{p.customer_company_name || "-"}</TableCell>
            <TableCell>
              <Badge className={statusColors[p.project_status?.toLowerCase() || ""] || "bg-gray-500/10 text-gray-500"}>{p.project_status || "-"}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{p.start_date ? new Date(p.start_date).toLocaleDateString() : "-"}</TableCell>
            <TableCell className="text-muted-foreground">{p.risk_level || "None"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderTasksTable = (tasks: Task[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-foreground">Name</TableHead>
          <TableHead className="text-foreground">Project</TableHead>
          <TableHead className="text-foreground">Assigned Role</TableHead>
          <TableHead className="text-foreground">Est. Hours</TableHead>
          <TableHead className="text-foreground">NetSuite ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="font-medium text-foreground">{t.task_name}</TableCell>
            <TableCell className="text-muted-foreground">{t.project_name || "-"}</TableCell>
            <TableCell className="text-muted-foreground">{t.assigned_role || "-"}</TableCell>
            <TableCell className="text-muted-foreground">{t.estimated_hours || "-"}</TableCell>
            <TableCell className="text-muted-foreground">{t.netsuite_id || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  switch (entityType) {
    case "prospects":
      return renderProspectsTable(data as Prospect[]);
    case "customers":
      return renderCustomersTable(data as Customer[]);
    case "service_items":
      return renderServiceItemsTable(data as ServiceItem[]);
    case "projects":
      return renderProjectsTable(data as Project[]);
    case "tasks":
      return renderTasksTable(data as Task[]);
  }
}
