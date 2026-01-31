"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Prospect, Customer, ServiceItem, Project, Task, EntityType } from "@/lib/demo-types";

interface DataTableProps {
  entityType: EntityType;
  data: Prospect[] | Customer[] | ServiceItem[] | Project[] | Task[];
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

export function DataTable({ entityType, data }: DataTableProps) {
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
          <TableHead className="text-foreground">Name</TableHead>
          <TableHead className="text-foreground">Type</TableHead>
          <TableHead className="text-foreground">Rate</TableHead>
          <TableHead className="text-foreground">Rate Type</TableHead>
          <TableHead className="text-foreground">Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((i) => (
          <TableRow key={i.id}>
            <TableCell className="font-medium text-foreground">{i.item_name}</TableCell>
            <TableCell className="text-muted-foreground">{i.item_type}</TableCell>
            <TableCell className="text-muted-foreground">${Number(i.rate).toFixed(2)}</TableCell>
            <TableCell className="text-muted-foreground">{i.rate_type}</TableCell>
            <TableCell className="text-muted-foreground max-w-xs truncate">{i.description || "-"}</TableCell>
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
