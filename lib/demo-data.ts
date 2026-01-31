import { sql } from './db';
import type { Prospect, Customer, ServiceItem, Project, Task } from './demo-types';

export async function getProspects(): Promise<Prospect[]> {
  const result = await sql`SELECT * FROM prospects ORDER BY created_at DESC`;
  return result as Prospect[];
}

export async function getCustomers(): Promise<Customer[]> {
  const result = await sql`SELECT * FROM customers ORDER BY created_at DESC`;
  return result as Customer[];
}

export async function getServiceItems(): Promise<ServiceItem[]> {
  const result = await sql`SELECT * FROM service_items ORDER BY created_at DESC`;
  return result as ServiceItem[];
}

export async function getProjects(): Promise<Project[]> {
  const result = await sql`
    SELECT p.*, c.company_name as customer_company_name 
    FROM projects p 
    LEFT JOIN customers c ON p.customer_id = c.id 
    ORDER BY p.created_at DESC
  `;
  return result as Project[];
}

export async function getTasks(): Promise<Task[]> {
  const result = await sql`
    SELECT t.*, p.project_name as project_name
    FROM tasks t 
    LEFT JOIN projects p ON t.project_id = p.id 
    ORDER BY t.created_at DESC
  `;
  return result as Task[];
}

export async function getEntityCounts() {
  const [prospects, customers, serviceItems, projects, tasks] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM prospects`,
    sql`SELECT COUNT(*) as count FROM customers`,
    sql`SELECT COUNT(*) as count FROM service_items`,
    sql`SELECT COUNT(*) as count FROM projects`,
    sql`SELECT COUNT(*) as count FROM tasks`,
  ]);
  
  return {
    prospects: Number(prospects[0].count),
    customers: Number(customers[0].count),
    serviceItems: Number(serviceItems[0].count),
    projects: Number(projects[0].count),
    tasks: Number(tasks[0].count),
  };
}

export async function insertProspect(prospect: Omit<Prospect, 'id' | 'created_at'>) {
  const result = await sql`
    INSERT INTO prospects (company_name, website_url, phone, email, subsidiary, status)
    VALUES (${prospect.company_name}, ${prospect.website_url}, ${prospect.phone}, ${prospect.email}, ${prospect.subsidiary}, ${prospect.status})
    RETURNING *
  `;
  return result[0] as Prospect;
}

export async function insertCustomer(customer: Omit<Customer, 'id' | 'created_at'>) {
  const result = await sql`
    INSERT INTO customers (company_name, contact_name, contact_email, phone, subsidiary, status, prospect_id, netsuite_id, selected)
    VALUES (${customer.company_name}, ${customer.contact_name}, ${customer.contact_email}, ${customer.phone}, ${customer.subsidiary}, ${customer.status}, ${customer.prospect_id}, ${customer.netsuite_id}, ${customer.selected})
    RETURNING *
  `;
  return result[0] as Customer;
}

export async function insertServiceItem(item: Omit<ServiceItem, 'id' | 'created_at'>) {
  const result = await sql`
    INSERT INTO service_items (item_name, item_type, description, rate, rate_type, prospect_id, netsuite_id, selected)
    VALUES (${item.item_name}, ${item.item_type}, ${item.description}, ${item.rate}, ${item.rate_type}, ${item.prospect_id}, ${item.netsuite_id}, ${item.selected})
    RETURNING *
  `;
  return result[0] as ServiceItem;
}

export async function insertProject(project: Omit<Project, 'id' | 'created_at' | 'customer_company_name'>) {
  const result = await sql`
    INSERT INTO projects (project_id, project_name, customer_id, subsidiary, project_status, project_manager, scheduling_method, start_date, calculated_end_date, estimated_end_date, planned_work, percent_complete, risk_level, netsuite_id, selected)
    VALUES (${project.project_id}, ${project.project_name}, ${project.customer_id}, ${project.subsidiary}, ${project.project_status}, ${project.project_manager}, ${project.scheduling_method}, ${project.start_date}, ${project.calculated_end_date}, ${project.estimated_end_date}, ${project.planned_work}, ${project.percent_complete}, ${project.risk_level}, ${project.netsuite_id}, ${project.selected})
    RETURNING *
  `;
  return result[0] as Project;
}

export async function insertTask(task: Omit<Task, 'id' | 'created_at' | 'project_name'>) {
  const result = await sql`
    INSERT INTO tasks (task_name, project_id, prospect_id, assigned_role, estimated_hours, netsuite_id, selected)
    VALUES (${task.task_name}, ${task.project_id}, ${task.prospect_id}, ${task.assigned_role}, ${task.estimated_hours}, ${task.netsuite_id}, ${task.selected})
    RETURNING *
  `;
  return result[0] as Task;
}

export async function deleteAllData() {
  await sql`DELETE FROM tasks`;
  await sql`DELETE FROM projects`;
  await sql`DELETE FROM service_items`;
  await sql`DELETE FROM customers`;
  await sql`DELETE FROM prospects`;
}
