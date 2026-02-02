import { NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import {
  insertProspect,
  insertCustomer,
  insertServiceItem,
  insertProject,
  insertTask,
  getCustomers,
  getProjects,
  getServiceItems,
} from "@/lib/demo-data";
import type { EntityType } from "@/lib/demo-types";

const prospectSchema = z.object({
  company_name: z.string(),
  website_url: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  subsidiary: z.string().nullable(),
  status: z.string().nullable(),
});

const customerSchema = z.object({
  company_name: z.string(),
  contact_name: z.string(),
  contact_email: z.string(),
  phone: z.string().nullable(),
  subsidiary: z.string().nullable(),
  status: z.string().nullable(),
  prospect_id: z.number().nullable(),
  netsuite_id: z.string().nullable(),
  selected: z.boolean(),
});

const serviceItemSchema = z.object({
  item_name: z.string(),
  display_name: z.string().nullable(),
  item_type: z.string(),
  description: z.string().nullable(),
  unit_type: z.string().nullable(),
  sales_price: z.number().nullable(),
  purchase_price: z.number().nullable(),
  income_account: z.string().nullable(),
  expense_account: z.string().nullable(),
  tax_schedule: z.string().nullable(),
  prospect_id: z.number().nullable(),
  netsuite_id: z.string().nullable(),
  selected: z.boolean(),
});

const projectSchema = z.object({
  project_id: z.string().nullable(),
  project_name: z.string(),
  customer_id: z.number().nullable(),
  subsidiary: z.string().nullable(),
  project_status: z.string().nullable(),
  project_manager: z.string().nullable(),
  scheduling_method: z.string().nullable(),
  start_date: z.string().nullable(),
  calculated_end_date: z.string().nullable(),
  estimated_end_date: z.string().nullable(),
  planned_work: z.number().nullable(),
  percent_complete: z.number().nullable(),
  risk_level: z.string().nullable(),
  netsuite_id: z.string().nullable(),
  selected: z.boolean(),
});

const taskSchema = z.object({
  task_name: z.string(),
  project_id: z.number().nullable(),
  prospect_id: z.number().nullable(),
  assigned_role: z.string().nullable(),
  estimated_hours: z.number().nullable(),
  netsuite_id: z.string().nullable(),
  selected: z.boolean(),
});

export async function POST(req: Request) {
  try {
    const { entityType, count } = (await req.json()) as {
      entityType: EntityType;
      count: number;
    };

    const clampedCount = Math.min(Math.max(count, 1), 50);

    switch (entityType) {
      case "prospects": {
        const result = await generateText({
          model: anthropic("claude-3-haiku-20240307"),
          output: Output.object({
            schema: z.object({ items: z.array(prospectSchema) }),
          }),
          prompt: `Generate ${clampedCount} realistic business prospects for a B2B software/consulting company. Use realistic company names and website URLs. Phone numbers in US format like "(555) 123-4567". Email addresses like "info@company.com". Subsidiary should be "Parent (Holding Co.)" or null. Status should be "PROSPECT-New", "PROSPECT-Qualified", or "PROSPECT-Closed Lost".`,
        });

        for (const item of result.output?.items || []) {
          await insertProspect(item);
        }
        break;
      }

      case "customers": {
        const result = await generateText({
          model: anthropic("claude-3-haiku-20240307"),
          output: Output.object({
            schema: z.object({ items: z.array(customerSchema) }),
          }),
          prompt: `Generate ${clampedCount} realistic business customers for a B2B software company. Use realistic company names, contact names (first and last), and professional email addresses. Phone numbers in US format like "(555) 123-4567". Subsidiary should be "Parent (Holding Co.)" or null. Status should be "CUSTOMER-Closed Won", "CUSTOMER-Active", or "CUSTOMER-Renewal". Set prospect_id to null, netsuite_id to null, and selected to false.`,
        });

        for (const item of result.output?.items || []) {
          await insertCustomer(item);
        }
        break;
      }

      case "service_items": {
        const result = await generateText({
          model: anthropic("claude-3-haiku-20240307"),
          output: Output.object({
            schema: z.object({ items: z.array(serviceItemSchema) }),
          }),
          prompt: `Generate ${clampedCount} realistic service items for a professional services/consulting company using NetSuite field naming conventions.

Fields:
- item_name: Short identifier like "CONSULT-001", "TRAIN-ADV", "SUPPORT-PREM"
- display_name: Full descriptive name like "Senior Consultant - Hourly", "Advanced Training Package"
- item_type: "Service", "Non-inventory Part", "Service for Resale", or "Other Charge"
- description: Brief description of the service
- unit_type: Must be exactly one of: "Hour", "Day", "Week", or "Each"
- sales_price: The price charged to customers ($75-$350 for hourly services, $500-$5000 for packages)
- purchase_price: The cost/purchase price (typically 40-60% of sales_price, or null if not purchased)
- income_account: "4000 Sales" or "4100 Service Revenue" or null
- expense_account: "5000 Cost of Sales" or null
- tax_schedule: "S1 - Taxable" or "S2 - Non Taxable"
- prospect_id: null
- netsuite_id: null
- selected: false`,
        });

        for (const item of result.output?.items || []) {
          await insertServiceItem(item);
        }
        break;
      }

      case "projects": {
        const customers = await getCustomers();
        const customerIds = customers.length > 0 ? customers.map((c) => c.id) : null;
        
        const result = await generateText({
          model: anthropic("claude-3-haiku-20240307"),
          output: Output.object({
            schema: z.object({ items: z.array(projectSchema) }),
          }),
          prompt: `Generate ${clampedCount} realistic software/consulting projects. ${customerIds ? `Use these customer IDs randomly: ${customerIds.join(", ")}.` : "Set customer_id to null."} 
          
          Fields:
          - project_id: Format like "PRJ1001", "PRJ1002", etc.
          - project_name: Descriptive names like "ERP Implementation Phase 2" or "Mobile App Development"
          - subsidiary: "Parent (Holding Co.)" or null
          - project_status: "In Progress", "Planned", "Completed", or "On Hold"
          - project_manager: Realistic names like "John Smith"
          - scheduling_method: Always "Forward"
          - start_date: Dates in 2024-2025 format "YYYY-MM-DD"
          - calculated_end_date: null
          - estimated_end_date: 3-12 months after start_date
          - planned_work: Hours between 100-2000
          - percent_complete: 0-100
          - risk_level: "None", "Low", "Medium", or "High"
          - netsuite_id: null
          - selected: false`,
        });

        for (const item of result.output?.items || []) {
          await insertProject({
            ...item,
            start_date: item.start_date ? new Date(item.start_date) : null,
            calculated_end_date: item.calculated_end_date ? new Date(item.calculated_end_date) : null,
            estimated_end_date: item.estimated_end_date ? new Date(item.estimated_end_date) : null,
          });
        }
        break;
      }

      case "tasks": {
        const projects = await getProjects();
        const projectIds = projects.length > 0 ? projects.map((p) => p.id) : null;

        const result = await generateText({
          model: anthropic("claude-3-haiku-20240307"),
          output: Output.object({
            schema: z.object({ items: z.array(taskSchema) }),
          }),
          prompt: `Generate ${clampedCount} realistic project tasks. ${projectIds ? `Use these project IDs randomly: ${projectIds.join(", ")}.` : "Set project_id to null."} Task names should be specific like "Design user authentication flow", "Configure payment gateway", "Setup CI/CD pipeline". Assigned roles should be like "Senior Developer", "Project Manager", "QA Engineer", "UX Designer". Estimated hours between 2-40. Set prospect_id to null, netsuite_id to null, and selected to false.`,
        });

        for (const item of result.output?.items || []) {
          await insertTask(item);
        }
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error generating data:", error);
    return NextResponse.json(
      { error: "Failed to generate data" },
      { status: 500 }
    );
  }
}
