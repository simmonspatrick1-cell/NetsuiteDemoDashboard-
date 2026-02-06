import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  quickSetup,
  createCustomer,
  createProject,
  createServiceItem,
  createTimeEntry,
  batchCreate,
  createEstimate,
  createProjectTask,
  type TemplateType,
  type EstimateLineItem,
  type ProjectTaskAssignee,
} from "@/lib/netsuite";

interface PushRequest {
  action?: "quick_setup" | "create_customer" | "create_project" | "create_service_item" | "create_time_entry" | "batch_create" | "push_entity" | "create_estimate" | "create_project_task";
  entityType?: "service_items" | "customers" | "projects" | "prospects" | "tasks";
  prospectName?: string;
  template?: TemplateType;
  customerName?: string;
  email?: string;
  phone?: string;
  projectName?: string;
  customerId?: number;
  itemName?: string;
  displayName?: string;
  unitType?: string;
  salesPrice?: number;
  purchasePrice?: number;
  customerCount?: number;
  projectsPerCustomer?: number;
  daysOfTime?: number;
  // Time entry fields
  employeeId?: number;
  hours?: number;
  date?: string;
  isBillable?: boolean;
  serviceItemId?: number;
  // Estimate fields
  projectId?: number;
  title?: string;
  memo?: string;
  salesRepId?: number;
  subsidiary?: number;
  trandate?: string;
  duedate?: string;
  items?: EstimateLineItem[];
  // Project Task fields
  taskName?: string;
  plannedWork?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  finishByDate?: string;
  parentTaskId?: number;
  defaultServiceItemId?: number;
  constraintType?: string;
  nonBillable?: boolean;
  assignees?: ProjectTaskAssignee[];
}

async function pushEntity(entityType: string) {
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  // Helper to extract an ID from various RESTlet response shapes
  const extractId = (data: any, candidates: string[]): string | null => {
    if (!data) return null;
    // Sometimes the payload comes under data.data
    const inner = (data && typeof data === 'object' && 'data' in data) ? (data as any).data : data;
    for (const key of candidates) {
      const val = inner?.[key] ?? data?.[key] ?? data?.data?.[key];
      if (val != null) return String(val);
    }
    // Common generic field
    if (inner?.id != null) return String(inner.id);
    if (data?.id != null) return String(data.id);
    if (data?.data?.id != null) return String(data.data.id);
    return null;
  };

  switch (entityType) {
    case "service_items": {
      // Get all service items without a netsuite_id
      const items = await sql`SELECT * FROM service_items WHERE netsuite_id IS NULL`;
      
      for (const item of items) {
        const result = await createServiceItem({
          itemName: item.item_name,
        });
        
        if (result.success && result.data) {
          const id = extractId(result.data, ["itemId"]);
          if (id) {
            await sql`
              UPDATE service_items SET netsuite_id = ${id} WHERE id = ${item.id}
            `;
            successCount++;
          } else {
            errorCount++;
            errors.push(`${item.item_name}: No item ID returned`);
          }
        } else {
          errorCount++;
          errors.push(`${item.item_name}: ${result.error || "Unknown error"}`);
        }
      }
      break;
    }

    case "customers": {
      const customers = await sql`SELECT * FROM customers WHERE netsuite_id IS NULL`;
      
      for (const customer of customers) {
        const result = await createCustomer({
          companyName: customer.company_name,
          email: customer.contact_email || undefined,
          phone: customer.phone || undefined,
        });
        
        if (result.success && result.data) {
          const id = extractId(result.data, ["customerId"]);
          if (id) {
            await sql`
              UPDATE customers SET netsuite_id = ${id} WHERE id = ${customer.id}
            `;
            successCount++;
          } else {
            errorCount++;
            errors.push(`${customer.company_name}: No customer ID returned`);
          }
        } else {
          errorCount++;
          errors.push(`${customer.company_name}: ${result.error || "Unknown error"}`);
        }
      }
      break;
    }

    case "projects": {
      const projects = await sql`SELECT * FROM projects WHERE netsuite_id IS NULL AND customer_id IS NOT NULL`;
      
      for (const project of projects) {
        // Get the customer's netsuite_id
        const customerResult = await sql`SELECT netsuite_id FROM customers WHERE id = ${project.customer_id}`;
        const netsuiteCustomerId = customerResult[0]?.netsuite_id;
        
        if (!netsuiteCustomerId) {
          errorCount++;
          errors.push(`${project.project_name}: Customer not synced to NetSuite`);
          continue;
        }
        
        const result = await createProject({
          projectName: project.project_name,
          customerId: parseInt(netsuiteCustomerId),
        });
        
        if (result.success && result.data) {
          const id = extractId(result.data, ["projectId"]);
          if (id) {
            await sql`
              UPDATE projects SET netsuite_id = ${id} WHERE id = ${project.id}
            `;
            successCount++;
          } else {
            errorCount++;
            errors.push(`${project.project_name}: No project ID returned`);
          }
        } else {
          errorCount++;
          errors.push(`${project.project_name}: ${result.error || "Unknown error"}`);
        }
      }
      break;
    }

    default:
      return NextResponse.json(
        { error: `Push not implemented for entity type: ${entityType}` },
        { status: 400 }
      );
  }

  return NextResponse.json({
    success: errorCount === 0,
    message: `Pushed ${successCount} ${entityType} to NetSuite${errorCount > 0 ? `, ${errorCount} failed` : ""}`,
    successCount,
    errorCount,
    errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PushRequest;
    const { action, entityType } = body;

    // Handle legacy entity-based push from entity panel
    if (entityType && !action) {
      return pushEntity(entityType);
    }

    switch (action) {
      case "quick_setup": {
        if (!body.prospectName) {
          return NextResponse.json(
            { error: "prospectName is required for quick_setup" },
            { status: 400 }
          );
        }
        
        const result = await quickSetup(body.prospectName, body.template || "professional_services");
        
        if (result.success && result.data) {
          // Store created customers and projects in our database
          // Map NetSuite customer IDs to local database IDs
          const netsuiteToLocalCustomerId = new Map<number, number>();
          
          for (const customer of result.data.customers || []) {
            const inserted = await sql`
              INSERT INTO customers (company_name, contact_name, contact_email, netsuite_id, selected)
              VALUES (${customer.name}, ${body.prospectName}, '', ${customer.id.toString()}, false)
              ON CONFLICT (netsuite_id) DO UPDATE SET company_name = EXCLUDED.company_name
              RETURNING id
            `;
            if (inserted[0]?.id) {
              netsuiteToLocalCustomerId.set(customer.id, inserted[0].id);
            }
          }
          
          for (const project of result.data.projects || []) {
            // Look up the local customer ID from the NetSuite customer ID
            const localCustomerId = netsuiteToLocalCustomerId.get(project.customerId) || null;
            
            await sql`
              INSERT INTO projects (project_name, customer_id, project_status, netsuite_id, selected)
              VALUES (${project.name}, ${localCustomerId}, 'Active', ${project.id.toString()}, false)
              ON CONFLICT (netsuite_id) DO UPDATE SET project_name = EXCLUDED.project_name
            `;
          }
        }
        
        return NextResponse.json(result);
      }

      case "create_customer": {
        if (!body.customerName) {
          return NextResponse.json(
            { error: "customerName is required for create_customer" },
            { status: 400 }
          );
        }
        
        const result = await createCustomer({
          companyName: body.customerName,
          email: body.email,
          phone: body.phone,
        });
        
        if (result.success && result.data) {
          const data = result.data as { data?: { customerId?: number; name?: string } };
          if (data.data?.customerId) {
            await sql`
              INSERT INTO customers (company_name, contact_name, contact_email, phone, netsuite_id, selected)
              VALUES (${body.customerName}, '', ${body.email || ''}, ${body.phone || null}, ${data.data.customerId.toString()}, false)
            `;
          }
        }
        
        return NextResponse.json(result);
      }

      case "create_project": {
        if (!body.projectName || !body.customerId) {
          return NextResponse.json(
            { error: "projectName and customerId are required for create_project" },
            { status: 400 }
          );
        }
        
        const result = await createProject({
          projectName: body.projectName,
          customerId: body.customerId,
        });
        
        if (result.success && result.data) {
          const data = result.data as { data?: { projectId?: number; name?: string } };
          if (data.data?.projectId) {
            await sql`
              INSERT INTO projects (project_name, project_status, project_manager, netsuite_id, selected)
              VALUES (${body.projectName}, 'In Progress', 'Marc Collins', ${data.data.projectId.toString()}, false)
            `;
          }
        }
        
        return NextResponse.json(result);
      }

      case "create_service_item": {
        if (!body.itemName) {
          return NextResponse.json(
            { error: "itemName is required for create_service_item" },
            { status: 400 }
          );
        }
        
        const result = await createServiceItem({
          itemName: body.itemName,
          displayName: body.displayName,
          unitType: body.unitType,
          salesPrice: body.salesPrice,
          purchasePrice: body.purchasePrice,
        });

        if (result.success && result.data) {
          const data = result.data as { data?: { itemId?: number; name?: string } };
          if (data.data?.itemId) {
            await sql`
              INSERT INTO service_items (item_name, display_name, item_type, unit_type, sales_price, purchase_price, netsuite_id, selected)
              VALUES (${body.itemName}, ${body.displayName || null}, 'Service', ${body.unitType || null}, ${body.salesPrice || null}, ${body.purchasePrice || null}, ${data.data.itemId.toString()}, false)
              ON CONFLICT (netsuite_id) DO UPDATE SET item_name = EXCLUDED.item_name
            `;
          }
        }
        
        return NextResponse.json(result);
      }

      case "create_time_entry": {
        if (!body.employeeId || !body.projectId || !body.hours) {
          return NextResponse.json(
            { error: "employeeId, projectId, and hours are required for create_time_entry" },
            { status: 400 }
          );
        }

        const result = await createTimeEntry({
          employeeId: body.employeeId,
          projectId: body.projectId,
          hours: body.hours,
          date: body.date,
          isBillable: body.isBillable,
          memo: body.memo,
          serviceItemId: body.serviceItemId,
        });

        return NextResponse.json(result);
      }

      case "batch_create": {
        const result = await batchCreate({
          template: body.template,
          customerCount: body.customerCount,
          projectsPerCustomer: body.projectsPerCustomer,
          daysOfTime: body.daysOfTime,
        });

        return NextResponse.json(result);
      }

      case "create_estimate": {
        if (!body.customerId) {
          return NextResponse.json(
            { error: "customerId is required for create_estimate" },
            { status: 400 }
          );
        }
        if (!body.items || body.items.length === 0) {
          return NextResponse.json(
            { error: "At least one line item is required for create_estimate" },
            { status: 400 }
          );
        }

        const result = await createEstimate({
          customerId: body.customerId,
          projectId: body.projectId,
          title: body.title,
          memo: body.memo,
          salesRepId: body.salesRepId,
          subsidiary: body.subsidiary,
          trandate: body.trandate,
          duedate: body.duedate,
          items: body.items,
        });

        return NextResponse.json(result);
      }

      case "create_project_task": {
        if (!body.projectId) {
          return NextResponse.json(
            { error: "projectId is required for create_project_task" },
            { status: 400 }
          );
        }
        if (!body.taskName) {
          return NextResponse.json(
            { error: "taskName is required for create_project_task" },
            { status: 400 }
          );
        }
        if (!body.plannedWork) {
          return NextResponse.json(
            { error: "plannedWork is required for create_project_task" },
            { status: 400 }
          );
        }

        const result = await createProjectTask({
          projectId: body.projectId,
          taskName: body.taskName,
          plannedWork: body.plannedWork,
          status: body.status,
          startDate: body.startDate,
          endDate: body.endDate,
          finishByDate: body.finishByDate,
          parentTaskId: body.parentTaskId,
          defaultServiceItemId: body.defaultServiceItemId,
          constraintType: body.constraintType,
          nonBillable: body.nonBillable,
          assignees: body.assignees,
        });

        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error pushing to NetSuite:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to push to NetSuite" },
      { status: 500 }
    );
  }
}
